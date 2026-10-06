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
  /** Radius of a round body. Give either `radius` or `width` and `height`. */
  radius?: number;
  /** Size of a box. It rotates with `angle`, so cards and buttons can fall and tip over. */
  width?: number;
  height?: number;
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
  /** "circle" or "box". */
  readonly shape: "circle" | "box";
  /** Radius of a circle; for a box the radius of the circle around it. */
  readonly radius: number;
  /** Size of a box, 0 for a circle. */
  readonly width: number;
  readonly height: number;
  readonly mass: number;
  restitution: number;
  friction: number;
  readonly fixed: boolean;
  /** True while the body rests. It wakes when something hits it or you call `world.wake(body)`. */
  sleeping: boolean;
  element: HTMLElement | SVGElement | null;
  /** @internal */ invMass: number;
  /** @internal */ invInertia: number;
  /** @internal */ rest: { x: number; y: number; a: number; time: number };
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

const SLEEP_DISTANCE = 4;
const SLEEP_TIME = 1;
/** Approach speed in px/s from which a resting body is woken by another one. */
const WAKE_SPEED = 60;
const BOX_SLOP = 1e-3;
/** Contact speed in px/s below which friction holds instead of slipping. */
const STICK_SPEED = 3;
/** Spin kept per contact of a resting box. */
const BOX_REST_DAMPING = 0.9;

/** The four corners of a box, counter-clockwise from the top left when not rotated. */
function corner(body: Body, k: number): Vector {
  const c = Math.cos(body.angle);
  const s = Math.sin(body.angle);
  const lx = (k === 0 || k === 3 ? -1 : 1) * (body.width / 2);
  const ly = (k < 2 ? -1 : 1) * (body.height / 2);
  return { x: body.x + lx * c - ly * s, y: body.y + lx * s + ly * c };
}

/** Half the extent of a box along a direction. */
function reach(body: Body, nx: number, ny: number): number {
  const c = Math.cos(body.angle);
  const s = Math.sin(body.angle);
  return (
    (body.width / 2) * Math.abs(c * nx + s * ny) + (body.height / 2) * Math.abs(-s * nx + c * ny)
  );
}

interface Manifold {
  nx: number;
  ny: number;
  /** Contact points in world space with their penetration depth. */
  points: { x: number; y: number; depth: number }[];
}

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
  #observer: ResizeObserver | null = null;
  #running = false;
  /** Speed that gravity adds per step along the normal of a floor contact, in px/s. */
  #weight = 0;
  #down: Vector = { x: 0, y: 1 };

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
    const box = options.width !== undefined && options.height !== undefined;
    const w = options.width ?? 0;
    const h = options.height ?? 0;
    const r = box ? Math.hypot(w, h) / 2 : (options.radius ?? 0);
    if (!box && !(r > 0)) throw new Error("A body needs a radius, or a width and a height.");
    const area = box ? (w / ppm) * (h / ppm) : Math.PI * (r / ppm) ** 2;
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
      shape: box ? "box" : "circle",
      radius: r,
      width: w,
      height: h,
      mass,
      restitution: options.restitution ?? 0.5,
      friction: options.friction ?? 0.4,
      fixed: options.fixed ?? false,
      sleeping: false,
      element: options.element ?? null,
      invMass: options.fixed ? 0 : 1 / mass,
      // Solid disc: I = ½·m·r², solid box: I = m·(w² + h²)/12, with lengths in pixels so
      // impulses stay in pixel units.
      invInertia: options.fixed ? 0 : box ? 12 / (mass * (w * w + h * h)) : 2 / (mass * r * r),
      rest: { x: options.x, y: options.y, a: 0, time: 0 },
    };
    this.bodies.push(body);
    this.#draw(body);
    this.#run();
    return body;
  }

  remove(body: Body): void {
    const index = this.bodies.indexOf(body);
    if (index >= 0) this.bodies.splice(index, 1);
    // Bodies that rested on it must fall.
    this.wake();
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
    this.wake(a);
    this.wake(b);
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
      if (body.shape === "box") {
        const c = Math.cos(body.angle);
        const s = Math.sin(body.angle);
        const lx = (x - body.x) * c + (y - body.y) * s;
        const ly = -(x - body.x) * s + (y - body.y) * c;
        if (Math.abs(lx) <= body.width / 2 && Math.abs(ly) <= body.height / 2) return body;
      } else if ((body.x - x) ** 2 + (body.y - y) ** 2 <= body.radius ** 2) return body;
    }
    return null;
  }

  /** Pulls a body towards a moving point with a stiff spring. Released bodies keep their speed. */
  grab(body: Body, x: number, y: number): Grab {
    const grab = { body, target: { x, y } };
    this.#grabs.add(grab);
    this.wake(body);
    return {
      move: (nx, ny) => {
        grab.target = { x: nx, y: ny };
        this.wake(body);
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
    this.wake(body);
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
    this.#run();
    return this;
  }

  /** Pauses the simulation. */
  stop(): this {
    this.#running = false;
    this.#stopLoop?.();
    this.#stopLoop = null;
    return this;
  }

  /** True while the world runs and something moves. A world at rest uses no CPU. */
  get awake(): boolean {
    return this.#stopLoop !== null;
  }

  /**
   * Wakes one resting body, or all of them, e.g. after you changed bodies by hand. Bodies
   * sleep one by one, so a big pile stays calm while a single ball keeps rolling.
   */
  wake(body?: Body): void {
    for (const b of body ? [body] : this.bodies) {
      b.sleeping = false;
      b.rest = { x: b.x, y: b.y, a: b.angle * b.radius, time: 0 };
    }
    this.#run();
  }

  #run(): void {
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

    // A body sleeps when it has not moved more than a pixel for a second. Measuring displacement
    // instead of speed ignores the tiny velocity that gravity adds to resting bodies every step.
    let busy = this.#grabs.size > 0;
    for (const { body } of this.#grabs) body.rest.time = 0;
    for (const body of this.bodies) {
      if (body.fixed || body.sleeping) continue;
      const rest = body.rest;
      const arc = body.angle * body.radius;
      if (
        Math.abs(body.x - rest.x) > SLEEP_DISTANCE ||
        Math.abs(body.y - rest.y) > SLEEP_DISTANCE ||
        Math.abs(arc - rest.a) > SLEEP_DISTANCE
      ) {
        body.rest = { x: body.x, y: body.y, a: arc, time: 0 };
      } else {
        rest.time += dt;
      }
      if (rest.time >= SLEEP_TIME && !this.#isGrabbed(body)) {
        body.sleeping = true;
        body.vx = 0;
        body.vy = 0;
        body.spin = 0;
      } else busy = true;
    }
    if (!busy) {
      this.#stopLoop?.();
      this.#stopLoop = null;
    }
  }

  #isGrabbed(body: Body): boolean {
    for (const grab of this.#grabs) if (grab.body === body) return true;
    return false;
  }

  #draw(body: Body): void {
    const el = body.element;
    if (!el) return;
    const w = body.shape === "box" ? body.width / 2 : body.radius;
    const h = body.shape === "box" ? body.height / 2 : body.radius;
    el.style.transform = `translate3d(${body.x - w}px, ${body.y - h}px, 0) rotate(${body.angle}rad)`;
  }

  /** Advances the simulation by `dt` seconds. Called for you while the world runs. */
  step(dt: number): void {
    const ppm = this.pixelsPerMeter;
    const gx = this.gravity.x * ppm;
    const gy = this.gravity.y * ppm;
    const drag = Math.exp(-this.airDrag * dt);
    this.#weight = Math.hypot(gx, gy) * dt;
    if (this.#weight > 0) this.#down = { x: (gx * dt) / this.#weight, y: (gy * dt) / this.#weight };

    for (const body of this.bodies) {
      if (body.fixed || body.sleeping) continue;
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
      if (body.fixed || body.sleeping) continue;
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
          if ((a.fixed || a.sleeping) && (b.fixed || b.sleeping)) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const sum = a.radius + b.radius;
          const d2 = dx * dx + dy * dy;
          if (d2 >= sum * sum) continue;
          this.#collide(a, b, restingSpeed, pass === 0);
        }
        if (this.bounds && !a.fixed && !a.sleeping) {
          this.#walls(a, this.bounds, restingSpeed, pass === 0);
        }
      }
    }
  }

  /** Finds the contacts of two bodies whose circles around them overlap and resolves them. */
  #collide(a: Body, b: Body, restingSpeed: number, report: boolean): void {
    if (a.shape === "circle" && b.shape === "circle") {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const nx = d > 1e-9 ? dx / d : 1;
      const ny = d > 1e-9 ? dy / d : 0;
      this.#contact(
        a,
        b,
        nx,
        ny,
        a.radius + b.radius - d,
        nx * a.radius,
        ny * a.radius,
        -nx * b.radius,
        -ny * b.radius,
        restingSpeed,
        report,
        1,
      );
      return;
    }
    // A box always comes first, so the normal points from the box to the other body.
    const flip = a.shape === "circle";
    const first = flip ? b : a;
    const second = flip ? a : b;
    const m =
      second.shape === "circle" ? this.#boxCircle(first, second) : this.#boxBox(first, second);
    if (!m) return;
    const share = m.points.length > 1 ? 0.5 : 1;
    // Several points share the push apart; every point is checked again in the next pass.
    for (const p of m.points) {
      const nx = flip ? -m.nx : m.nx;
      const ny = flip ? -m.ny : m.ny;
      const ra = flip ? { x: p.x - b.x, y: p.y - b.y } : { x: p.x - a.x, y: p.y - a.y };
      const rb = flip ? { x: p.x - a.x, y: p.y - a.y } : { x: p.x - b.x, y: p.y - b.y };
      this.#contact(a, b, nx, ny, p.depth, ra.x, ra.y, rb.x, rb.y, restingSpeed, report, share);
    }
  }

  #boxCircle(box: Body, circle: Body): Manifold | null {
    const c = Math.cos(box.angle);
    const s = Math.sin(box.angle);
    const dx = circle.x - box.x;
    const dy = circle.y - box.y;
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    const hw = box.width / 2;
    const hh = box.height / 2;
    const px = Math.max(-hw, Math.min(hw, lx));
    const py = Math.max(-hh, Math.min(hh, ly));
    let nlx = lx - px;
    let nly = ly - py;
    let dist = Math.hypot(nlx, nly);
    let depth: number;
    let qx = px;
    let qy = py;
    if (dist > 1e-9) {
      depth = circle.radius - dist;
      if (depth <= 0) return null;
      nlx /= dist;
      nly /= dist;
    } else {
      // The centre is inside the box: leave through the nearest face.
      const gx = hw - Math.abs(lx);
      const gy = hh - Math.abs(ly);
      if (gx < gy) {
        nlx = lx < 0 ? -1 : 1;
        nly = 0;
        qx = nlx * hw;
        dist = -gx;
      } else {
        nlx = 0;
        nly = ly < 0 ? -1 : 1;
        qy = nly * hh;
        dist = -gy;
      }
      depth = circle.radius - dist;
    }
    return {
      nx: nlx * c - nly * s,
      ny: nlx * s + nly * c,
      points: [{ x: box.x + qx * c - qy * s, y: box.y + qx * s + qy * c, depth }],
    };
  }

  /** Separating axis test on the four face normals, then the corners inside the other box. */
  #boxBox(a: Body, b: Body): Manifold | null {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const axes: [number, number][] = [
      [Math.cos(a.angle), Math.sin(a.angle)],
      [-Math.sin(a.angle), Math.cos(a.angle)],
      [Math.cos(b.angle), Math.sin(b.angle)],
      [-Math.sin(b.angle), Math.cos(b.angle)],
    ];
    let best = Number.POSITIVE_INFINITY;
    let bx = 1;
    let by = 0;
    for (let k = 0; k < 4; k++) {
      const [ax, ay] = axes[k] as [number, number];
      const overlap = reach(a, ax, ay) + reach(b, ax, ay) - Math.abs(dx * ax + dy * ay);
      if (overlap <= 0) return null;
      // Prefer the first box's faces when two overlaps are about equal, so stacks stay steady.
      if (overlap < best - 0.05) {
        best = overlap;
        const sign = dx * ax + dy * ay < 0 ? -1 : 1;
        bx = ax * sign;
        by = ay * sign;
      }
    }
    const ra = reach(a, bx, by);
    const rb = reach(b, bx, by);
    const points: Manifold["points"] = [];
    const inside = (box: Body, p: Vector) => {
      const c = Math.cos(box.angle);
      const s = Math.sin(box.angle);
      const lx = (p.x - box.x) * c + (p.y - box.y) * s;
      const ly = -(p.x - box.x) * s + (p.y - box.y) * c;
      return (
        Math.abs(lx) <= box.width / 2 + BOX_SLOP + 0.5 &&
        Math.abs(ly) <= box.height / 2 + BOX_SLOP + 0.5
      );
    };
    for (let k = 0; k < 4; k++) {
      const p = corner(b, k);
      if (inside(a, p)) {
        const depth = ra - ((p.x - a.x) * bx + (p.y - a.y) * by);
        if (depth > 0) points.push({ ...p, depth });
      }
      const q = corner(a, k);
      if (inside(b, q)) {
        const depth = rb + ((q.x - b.x) * bx + (q.y - b.y) * by);
        if (depth > 0) points.push({ ...q, depth });
      }
    }
    points.sort((p, q) => q.depth - p.depth);
    if (points.length === 0) {
      // Edges crossing without a corner inside: one point on the face of the first box.
      points.push({ x: a.x + bx * ra, y: a.y + by * ra, depth: best });
    }
    return { nx: bx, ny: by, points: points.slice(0, 2) };
  }

  #spring(link: Link, dt: number): void {
    const { a, b } = link;
    // A resting body wakes when the one it is linked to moves.
    if (a.sleeping !== b.sleeping) {
      this.wake(a.sleeping ? a : b);
    }
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

  // Resolves one contact. n points from a to b; a may be a wall (null). ra and rb are the
  // vectors from the centres to the contact point. `share` splits the push apart between the
  // points of one collision.
  #contact(
    a: Body | null,
    b: Body,
    nx: number,
    ny: number,
    depth: number,
    rax: number,
    ray: number,
    rbx: number,
    rby: number,
    restingSpeed: number,
    report: boolean,
    share: number,
  ): void {
    const speed = (body: Body | null, rx: number, ry: number, o: "x" | "y") =>
      body ? (o === "x" ? body.vx - body.spin * ry : body.vy + body.spin * rx) : 0;
    // A sleeping body is immovable unless it is hit hard enough to wake it.
    let ima = a ? a.invMass : 0;
    let iia = a ? a.invInertia : 0;
    let imb = b.invMass;
    let iib = b.invInertia;
    const approach =
      (speed(b, rbx, rby, "x") - speed(a, rax, ray, "x")) * nx +
      (speed(b, rbx, rby, "y") - speed(a, rax, ray, "y")) * ny;
    if (a?.sleeping) {
      if (-approach > WAKE_SPEED) this.wake(a);
      else ima = iia = 0;
    }
    if (b.sleeping) {
      if (-approach > WAKE_SPEED) this.wake(b);
      else imb = iib = 0;
    }
    const inv0 = ima + imb;
    if (inv0 === 0) return;

    // Push apart, shared by inverse mass.
    const correction = (Math.max(depth - 0.01, 0) * share) / inv0;
    if (a) {
      a.x -= nx * correction * ima;
      a.y -= ny * correction * ima;
    }
    b.x += nx * correction * imb;
    b.y += ny * correction * imb;

    // Velocity of the contact point on each body: v + ω × r.
    const relative = () => ({
      x: speed(b, rbx, rby, "x") - speed(a, rax, ray, "x"),
      y: speed(b, rbx, rby, "y") - speed(a, rax, ray, "y"),
    });
    let rv = relative();
    const vn = rv.x * nx + rv.y * ny;
    const crossAn = rax * ny - ray * nx;
    const crossBn = rbx * ny - rby * nx;
    const kn = inv0 + crossAn * crossAn * iia + crossBn * crossBn * iib;
    let jn = 0;
    if (vn < 0) {
      const e = -vn < restingSpeed ? 0 : Math.min(a ? a.restitution : 1, b.restitution);
      jn = (-(1 + e) * vn) / kn;
      if (a) {
        a.vx -= jn * nx * ima;
        a.vy -= jn * ny * ima;
        a.spin -= jn * crossAn * iia;
      }
      b.vx += jn * nx * imb;
      b.vy += jn * ny * imb;
      b.spin += jn * crossBn * iib;
      if (report && -vn > restingSpeed) this.#options.onCollide?.(b, a, -vn);
    }

    // Coulomb friction along the tangent, which also makes round bodies roll. A contact that is
    // already pushed apart in a later pass still rests on the other body, so it keeps the
    // friction its weight gives it instead of letting resting boxes creep.
    const tx = -ny;
    const ty = nx;
    rv = relative();
    const vt = rv.x * tx + rv.y * ty;
    const crossAt = rax * ty - ray * tx;
    const crossBt = rbx * ty - rby * tx;
    const kt = inv0 + crossAt * crossAt * iia + crossBt * crossBt * iib;
    const mu = Math.sqrt((a ? a.friction : 1) * b.friction);
    const support =
      jn > 0 ? jn : (this.#weight * Math.abs(nx * this.#down.x + ny * this.#down.y)) / kn;
    // Slower than a few px/s is static friction: the surfaces stick instead of creeping.
    const jt =
      Math.abs(vt) < STICK_SPEED
        ? -vt / kt
        : Math.max(Math.min(-vt / kt, mu * support), -mu * support);
    if (a) {
      a.vx -= jt * tx * ima;
      a.vy -= jt * ty * ima;
      a.spin -= jt * crossAt * iia;
    }
    b.vx += jt * tx * imb;
    b.vy += jt * ty * imb;
    b.spin += jt * crossBt * iib;
    // Resting boxes rock a little between their corners; a touch of damping calms that.
    if (-vn < restingSpeed) {
      if (a?.shape === "box" && Math.abs(a.spin) < 2) a.spin *= BOX_REST_DAMPING;
      if (b.shape === "box" && Math.abs(b.spin) < 2) b.spin *= BOX_REST_DAMPING;
    }
    if (vn >= 0) return;

    // Rolling resistance for round bodies: a torque against the spin, limited so it never
    // reverses it.
    const brake = (body: Body, invInertia: number) => {
      if (body.shape !== "circle") return;
      const limit = this.rollingResistance * jn * body.radius * invInertia;
      body.spin = Math.abs(body.spin) <= limit ? 0 : body.spin - Math.sign(body.spin) * limit;
    };
    if (a) brake(a, iia);
    brake(b, iib);
  }

  #walls(body: Body, walls: Rect, restingSpeed: number, report: boolean): void {
    if (body.shape === "box") {
      // Each corner that pokes through a wall pushes back, so boxes can rest on an edge or tip.
      for (let k = 0; k < 4; k++) {
        const wall = (nx: number, ny: number, depth: number, p: Vector) =>
          this.#contact(
            null,
            body,
            nx,
            ny,
            depth,
            0,
            0,
            p.x - body.x,
            p.y - body.y,
            restingSpeed,
            report,
            0.5,
          );
        let p = corner(body, k);
        if (p.y > walls.bottom) wall(0, -1, p.y - walls.bottom, p);
        p = corner(body, k);
        if (p.y < walls.top) wall(0, 1, walls.top - p.y, p);
        p = corner(body, k);
        if (p.x < walls.left) wall(1, 0, walls.left - p.x, p);
        p = corner(body, k);
        if (p.x > walls.right) wall(-1, 0, p.x - walls.right, p);
      }
      return;
    }
    const r = body.radius;
    const wall = (nx: number, ny: number, depth: number) =>
      this.#contact(null, body, nx, ny, depth, 0, 0, -nx * r, -ny * r, restingSpeed, report, 1);
    if (body.y + r > walls.bottom) wall(0, -1, body.y + r - walls.bottom);
    if (body.y - r < walls.top) wall(0, 1, walls.top - (body.y - r));
    if (body.x - r < walls.left) wall(1, 0, walls.left - (body.x - r));
    if (body.x + r > walls.right) wall(-1, 0, body.x + r - walls.right);
  }
}

/** Creates a world. Call `start()` to run it on the frame loop, or `step()` it yourself. */
export function world(options: WorldOptions = {}): World {
  return new World(options);
}
