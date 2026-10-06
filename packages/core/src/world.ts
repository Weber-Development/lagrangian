// A small 2D physics world for UI: round bodies with gravity, air drag, collisions with
// restitution, Coulomb friction that makes them roll, springs between bodies and a pointer
// joint for grabbing and throwing. Fixed time step, so it behaves the same at 60 and 144 Hz.

import { loop } from "./loop";

export interface Vector {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BodyOptions {
  /** Centre in pixels. */
  x: number;
  y: number;
  radius: number;
  /** Mass in kg. Defaults to the area times `density`. */
  mass?: number;
  /** kg per square meter, used when `mass` is not given. Default 1. */
  density?: number;
  /** Bounciness, 0 (clay) to 1 (perfectly elastic). Default 0.5. */
  restitution?: number;
  /** Coulomb friction coefficient. Default 0.4. */
  friction?: number;
  /** Fixed bodies never move but others collide with them. */
  fixed?: boolean;
  /** Initial velocity in pixels per second. */
  vx?: number;
  vy?: number;
  /** Angle in radians and angular velocity in radians per second. */
  angle?: number;
  spin?: number;
  /** An element positioned at the top left of the world that follows this body. */
  element?: HTMLElement | SVGElement | null;
}

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  readonly radius: number;
  readonly mass: number;
  restitution: number;
  friction: number;
  readonly fixed: boolean;
  element: HTMLElement | SVGElement | null;
  /** @internal */ invMass: number;
  /** @internal */ invInertia: number;
}

export interface LinkOptions {
  /** Rest length in pixels. Defaults to the current distance. */
  length?: number;
  /** Oscillation frequency in Hz. Higher is stiffer. Default 4. */
  frequency?: number;
  /** Damping ratio, 0 to 1. Default 0.3. */
  damping?: number;
}

export interface Link {
  a: Body;
  b: Body;
  length: number;
  frequency: number;
  damping: number;
}

export interface WorldOptions {
  /** Gravity in m/s². Default { x: 0, y: 9.81 }. */
  gravity?: Vector;
  /** Scale between the simulation (meters) and the screen. Default 500 pixels per meter. */
  pixelsPerMeter?: number;
  /** Linear air drag per second. Default 0.05. */
  airDrag?: number;
  /**
   * Rolling resistance coefficient: a braking torque proportional to the contact force that
   * makes rolling bodies come to a stop and keeps resting piles still. Default 0.05.
   */
  rollingResistance?: number;
  /** Walls in pixels, or an element whose content box becomes the walls. */
  bounds?: Rect | HTMLElement | null;
  /** Simulation steps per second. Default 240. */
  rate?: number;
  /** Collision solver passes per step. More gives steadier stacks. Default 4. */
  iterations?: number;
  /** Called after every frame, e.g. to draw on a canvas. */
  onFrame?: (world: World) => void;
  /** Called when two bodies (or a body and a wall) hit with an impact speed in px/s. */
  onCollide?: (a: Body, b: Body | null, speed: number) => void;
}

export interface Grab {
  move(x: number, y: number): void;
  release(): void;
}

const SLEEP_DISTANCE = 1;
const SLEEP_TIME = 1;

export class World {
  readonly bodies: Body[] = [];
  readonly links: Link[] = [];
  gravity: Vector;
  pixelsPerMeter: number;
  airDrag: number;
  rollingResistance: number;
  iterations: number;
  bounds: Rect | null = null;
  readonly #rate: number;
  readonly #options: WorldOptions;
  #container: HTMLElement | null = null;
  #grabs = new Set<{ body: Body; target: Vector }>();
  #stopLoop: (() => void) | null = null;
  #pending = 0;
  #still = 0;
  #snapshot: [number, number, number][] = [];
  #observer: ResizeObserver | null = null;
  #running = false;

  constructor(options: WorldOptions = {}) {
    this.#options = options;
    this.gravity = options.gravity ?? { x: 0, y: 9.81 };
    this.pixelsPerMeter = options.pixelsPerMeter ?? 500;
    this.airDrag = options.airDrag ?? 0.05;
    this.rollingResistance = options.rollingResistance ?? 0.05;
    this.iterations = options.iterations ?? 4;
    this.#rate = options.rate ?? 240;
    this.setBounds(options.bounds ?? null);
  }

  /** Sets the walls. With an element, they follow its size. */
  setBounds(bounds: Rect | HTMLElement | null): void {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#container = null;
    if (bounds && typeof HTMLElement !== "undefined" && bounds instanceof HTMLElement) {
      this.#container = bounds;
      const read = () => {
        this.bounds = { left: 0, top: 0, right: bounds.clientWidth, bottom: bounds.clientHeight };
        this.wake();
      };
      read();
      if (typeof ResizeObserver === "function") {
        this.#observer = new ResizeObserver(read);
        this.#observer.observe(bounds);
      }
    } else {
      this.bounds = (bounds as Rect | null) ?? null;
      this.wake();
    }
  }

  add(options: BodyOptions): Body {
    const ppm = this.pixelsPerMeter;
    const r = options.radius;
    const area = Math.PI * (r / ppm) ** 2;
    const mass = options.fixed
      ? Number.POSITIVE_INFINITY
      : (options.mass ?? area * (options.density ?? 1));
    const body: Body = {
      x: options.x,
      y: options.y,
      vx: options.vx ?? 0,
      vy: options.vy ?? 0,
      angle: options.angle ?? 0,
      spin: options.spin ?? 0,
      radius: r,
      mass,
      restitution: options.restitution ?? 0.5,
      friction: options.friction ?? 0.4,
      fixed: options.fixed ?? false,
      element: options.element ?? null,
      invMass: options.fixed ? 0 : 1 / mass,
      // Solid disc: I = ½·m·r², here with r in pixels so impulses stay in pixel units.
      invInertia: options.fixed ? 0 : 2 / (mass * r * r),
    };
    this.bodies.push(body);
    this.#draw(body);
    this.wake();
    return body;
  }

  remove(body: Body): void {
    const index = this.bodies.indexOf(body);
    if (index >= 0) this.bodies.splice(index, 1);
    for (let i = this.links.length - 1; i >= 0; i--) {
      const link = this.links[i] as Link;
      if (link.a === body || link.b === body) this.links.splice(i, 1);
    }
    for (const grab of this.#grabs) if (grab.body === body) this.#grabs.delete(grab);
  }

  /** Connects two bodies with a damped spring. */
  link(a: Body, b: Body, options: LinkOptions = {}): Link {
    const link: Link = {
      a,
      b,
      length: options.length ?? Math.hypot(b.x - a.x, b.y - a.y),
      frequency: options.frequency ?? 4,
      damping: options.damping ?? 0.3,
    };
    this.links.push(link);
    this.wake();
    return link;
  }

  unlink(link: Link): void {
    const index = this.links.indexOf(link);
    if (index >= 0) this.links.splice(index, 1);
  }

  /** Body under a point, if any. */
  bodyAt(x: number, y: number): Body | null {
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const body = this.bodies[i] as Body;
      if ((body.x - x) ** 2 + (body.y - y) ** 2 <= body.radius ** 2) return body;
    }
    return null;
  }

  /** Pulls a body towards a moving point with a stiff spring. Released bodies keep their speed. */
  grab(body: Body, x: number, y: number): Grab {
    const grab = { body, target: { x, y } };
    this.#grabs.add(grab);
    this.wake();
    return {
      move: (nx, ny) => {
        grab.target = { x: nx, y: ny };
        this.wake();
      },
      release: () => {
        this.#grabs.delete(grab);
      },
    };
  }

  /** Adds an impulse in kg·px/s at the centre (or `at` a point on the body for spin). */
  push(body: Body, impulse: Vector, at?: Vector): void {
    body.vx += impulse.x * body.invMass;
    body.vy += impulse.y * body.invMass;
    if (at)
      body.spin += ((at.x - body.x) * impulse.y - (at.y - body.y) * impulse.x) * body.invInertia;
    this.wake();
  }

  /**
   * Lets the pointer grab and throw bodies inside `element` (default: the bounds element).
   * Returns a function that removes the listeners.
   */
  bindPointer(element: HTMLElement | null = this.#container): () => void {
    if (!element) return () => {};
    const active = new Map<number, Grab>();
    const local = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const down = (event: PointerEvent) => {
      const p = local(event);
      const body = this.bodyAt(p.x, p.y);
      if (!body || body.fixed) return;
      event.preventDefault();
      element.setPointerCapture?.(event.pointerId);
      active.set(event.pointerId, this.grab(body, p.x, p.y));
    };
    const move = (event: PointerEvent) => {
      const grab = active.get(event.pointerId);
      if (!grab) return;
      const p = local(event);
      grab.move(p.x, p.y);
    };
    const up = (event: PointerEvent) => {
      active.get(event.pointerId)?.release();
      active.delete(event.pointerId);
    };
    const touchAction = element.style.touchAction;
    element.style.touchAction = "none";
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    return () => {
      for (const grab of active.values()) grab.release();
      element.style.touchAction = touchAction;
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
    };
  }

  /** Starts the simulation on the shared frame loop. */
  start(): this {
    this.#running = true;
    this.wake();
    return this;
  }

  /** Pauses the simulation. */
  stop(): this {
    this.#running = false;
    this.#stopLoop?.();
    this.#stopLoop = null;
    return this;
  }

  /** True while the world runs and something moves. A resting world uses no CPU. */
  get awake(): boolean {
    return this.#stopLoop !== null;
  }

  /** Resumes a resting world, e.g. after you changed bodies by hand. */
  wake(): void {
    this.#still = 0;
    this.#snapshot = [];
    if (!this.#running || this.#stopLoop) return;
    this.#stopLoop = loop.add((dt) => this.#frame(dt));
  }

  destroy(): void {
    this.stop();
    this.#observer?.disconnect();
    this.bodies.length = 0;
    this.links.length = 0;
    this.#grabs.clear();
  }

  #frame(dt: number): void {
    const h = 1 / this.#rate;
    this.#pending = Math.min(this.#pending + dt, h * 32);
    while (this.#pending >= h) {
      this.step(h);
      this.#pending -= h;
    }
    for (const body of this.bodies) this.#draw(body);
    this.#options.onFrame?.(this);

    // Sleep when nothing has moved more than a pixel for a second. Measuring displacement
    // instead of speed ignores the tiny velocity that gravity adds to resting bodies every step.
    if (this.#grabs.size > 0 || this.#moved()) {
      this.#still = 0;
      this.#snapshot = this.bodies.map((b) => [b.x, b.y, b.angle * b.radius]);
    } else {
      this.#still += dt;
    }
    if (this.#still >= SLEEP_TIME) {
      this.#stopLoop?.();
      this.#stopLoop = null;
    }
  }

  #moved(): boolean {
    const snapshot = this.#snapshot;
    if (snapshot.length !== this.bodies.length) return true;
    return this.bodies.some((b, i) => {
      const [x, y, arc] = snapshot[i] as [number, number, number];
      return (
        Math.abs(b.x - x) > SLEEP_DISTANCE ||
        Math.abs(b.y - y) > SLEEP_DISTANCE ||
        Math.abs(b.angle * b.radius - arc) > SLEEP_DISTANCE
      );
    });
  }

  #draw(body: Body): void {
    const el = body.element;
    if (!el) return;
    const r = body.radius;
    el.style.transform = `translate3d(${body.x - r}px, ${body.y - r}px, 0) rotate(${body.angle}rad)`;
  }

  /** Advances the simulation by `dt` seconds. Called for you while the world runs. */
  step(dt: number): void {
    const ppm = this.pixelsPerMeter;
    const gx = this.gravity.x * ppm;
    const gy = this.gravity.y * ppm;
    const drag = Math.exp(-this.airDrag * dt);

    for (const body of this.bodies) {
      if (body.fixed) continue;
      body.vx = (body.vx + gx * dt) * drag;
      body.vy = (body.vy + gy * dt) * drag;
      body.spin *= drag;
    }

    for (const link of this.links) this.#spring(link, dt);

    for (const { body, target } of this.#grabs) {
      // A critically damped 8 Hz joint, integrated implicitly so it never explodes:
      // v' = (v + dt·k·(target − x)) / (1 + dt·c + dt²·k)
      const w = 2 * Math.PI * 8;
      const k = w * w;
      const c = 2 * w;
      const den = 1 + dt * c + dt * dt * k;
      body.vx = (body.vx + dt * k * (target.x - body.x)) / den;
      body.vy = (body.vy + dt * k * (target.y - body.y)) / den;
      body.spin *= 0.9;
    }

    for (const body of this.bodies) {
      if (body.fixed) continue;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.spin * dt;
    }

    const bodies = [...this.bodies].sort((a, b) => a.x - a.radius - (b.x - b.radius));
    const restingSpeed = 0.5 * ppm;
    for (let pass = 0; pass < this.iterations; pass++) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i] as Body;
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j] as Body;
          if (b.x - b.radius > a.x + a.radius) break;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const sum = a.radius + b.radius;
          const d2 = dx * dx + dy * dy;
          if (d2 >= sum * sum) continue;
          const d = Math.sqrt(d2);
          const nx = d > 1e-9 ? dx / d : 1;
          const ny = d > 1e-9 ? dy / d : 0;
          this.#contact(a, b, nx, ny, sum - d, restingSpeed, pass === 0);
        }
        if (this.bounds && !a.fixed) this.#walls(a, this.bounds, restingSpeed, pass === 0);
      }
    }
  }

  #spring(link: Link, dt: number): void {
    const { a, b } = link;
    const inv = a.invMass + b.invMass;
    if (inv === 0) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1e-9;
    const nx = dx / d;
    const ny = dy / d;
    const m = 1 / inv;
    const w = 2 * Math.PI * link.frequency;
    const k = m * w * w;
    const c = 2 * m * link.damping * w;
    const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    const force = -k * (d - link.length) - c * vn;
    const j = force * dt;
    a.vx -= j * nx * a.invMass;
    a.vy -= j * ny * a.invMass;
    b.vx += j * nx * b.invMass;
    b.vy += j * ny * b.invMass;
  }

  // Resolves one contact. n points from a to b; a may be a wall (null).
  #contact(
    a: Body | null,
    b: Body,
    nx: number,
    ny: number,
    depth: number,
    restingSpeed: number,
    report: boolean,
  ): void {
    const ima = a ? a.invMass : 0;
    const imb = b.invMass;
    const inv = ima + imb;
    if (inv === 0) return;

    // Push apart, shared by inverse mass.
    const correction = Math.max(depth - 0.01, 0) / inv;
    if (a) {
      a.x -= nx * correction * ima;
      a.y -= ny * correction * ima;
    }
    b.x += nx * correction * imb;
    b.y += ny * correction * imb;

    const ra = a ? a.radius : 0;
    const rb = b.radius;
    const iia = a ? a.invInertia : 0;
    const iib = b.invInertia;
    // Velocity of the contact point on each body: v + ω × r, with r = ±radius·n.
    const tx = -ny;
    const ty = nx;
    const relative = () => {
      const vax = a ? a.vx - a.spin * ra * ny : 0;
      const vay = a ? a.vy + a.spin * ra * nx : 0;
      const vbx = b.vx + b.spin * rb * ny;
      const vby = b.vy - b.spin * rb * nx;
      return { x: vbx - vax, y: vby - vay };
    };
    let rv = relative();
    const vn = rv.x * nx + rv.y * ny;
    if (vn >= 0) return;

    const e = -vn < restingSpeed ? 0 : Math.min(a ? a.restitution : 1, b.restitution);
    const jn = (-(1 + e) * vn) / inv;
    if (a) {
      a.vx -= jn * nx * ima;
      a.vy -= jn * ny * ima;
    }
    b.vx += jn * nx * imb;
    b.vy += jn * ny * imb;
    if (report && -vn > restingSpeed) this.#options.onCollide?.(b, a, -vn);

    // Coulomb friction along the tangent, which also makes round bodies roll.
    rv = relative();
    const vt = rv.x * tx + rv.y * ty;
    const kt = inv + ra * ra * iia + rb * rb * iib;
    const mu = Math.sqrt((a ? a.friction : 1) * b.friction);
    const jt = Math.max(Math.min(-vt / kt, mu * jn), -mu * jn);
    if (a) {
      a.vx -= jt * tx * ima;
      a.vy -= jt * ty * ima;
      a.spin -= jt * ra * iia;
    }
    b.vx += jt * tx * imb;
    b.vy += jt * ty * imb;
    b.spin -= jt * rb * iib;

    // Rolling resistance: a torque against the spin, limited so it never reverses it.
    const brake = (body: Body, r: number) => {
      const limit = this.rollingResistance * jn * r * body.invInertia;
      body.spin = Math.abs(body.spin) <= limit ? 0 : body.spin - Math.sign(body.spin) * limit;
    };
    if (a) brake(a, ra);
    brake(b, rb);
  }

  #walls(body: Body, walls: Rect, restingSpeed: number, report: boolean): void {
    const r = body.radius;
    if (body.y + r > walls.bottom)
      this.#contact(null, body, 0, -1, body.y + r - walls.bottom, restingSpeed, report);
    if (body.y - r < walls.top)
      this.#contact(null, body, 0, 1, walls.top - (body.y - r), restingSpeed, report);
    if (body.x - r < walls.left)
      this.#contact(null, body, 1, 0, walls.left - (body.x - r), restingSpeed, report);
    if (body.x + r > walls.right)
      this.#contact(null, body, -1, 0, body.x + r - walls.right, restingSpeed, report);
  }
}

/** Creates a world. Call `start()` to run it on the frame loop, or `step()` it yourself. */
export function world(options: WorldOptions = {}): World {
  return new World(options);
}
