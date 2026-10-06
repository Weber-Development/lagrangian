// A number with momentum. It always knows its velocity, so a new animation, a throw or a drag
// can take over mid-flight without a jolt: the physics continues from the current state.

import { type DecayOptions, decay } from "./decay";
import { loop, now } from "./loop";
import { reducedMotion } from "./reduced-motion";
import { type Motion, restValue, type SpringOptions, spring } from "./spring";
import { VelocityTracker } from "./velocity";

/** A running animation. Await `finished` to know whether it completed. */
export interface Animation {
  /** Resolves with true when the motion came to rest, false when it was interrupted. */
  readonly finished: Promise<boolean>;
  stop(): void;
}

export type Listener = (value: number, velocity: number) => void;

export function settled(value: boolean): Animation {
  const finished = Promise.resolve(value);
  return { finished, stop() {} };
}

export class PhysicsValue {
  #value: number;
  #velocity = 0;
  #tracked = false;
  #listeners = new Set<Listener>();
  #tracker = new VelocityTracker();
  #cancel: (() => void) | null = null;
  #resolve: ((completed: boolean) => void) | null = null;

  constructor(initial = 0) {
    this.#value = initial;
  }

  get(): number {
    return this.#value;
  }

  /** Units per second, from the running motion or from recent `set` calls. */
  get velocity(): number {
    return this.#tracked ? this.#tracker.velocity(now()) : this.#velocity;
  }

  get animating(): boolean {
    return this.#cancel !== null;
  }

  /** Sets the value directly (e.g. while dragging). Stops any motion and tracks the velocity. */
  set(value: number): void {
    this.#halt(false);
    this.#tracked = true;
    this.#tracker.add(now(), value);
    this.#velocity = this.#tracker.velocity();
    this.#emit(value);
  }

  /** Sets the value and drops all momentum. */
  jump(value: number): void {
    this.#halt(false);
    this.#tracker.reset();
    this.#tracked = false;
    this.#velocity = 0;
    this.#emit(value);
  }

  /** Springs to `target`, starting from the current position and velocity. */
  to(target: number, options: SpringOptions & { velocity?: number } = {}): Animation {
    const from = this.#value;
    return this.start(spring(from, target, options.velocity ?? this.velocity, options));
  }

  /** Throws the value with friction, optionally into bounds or onto snap points. */
  throw(options: DecayOptions = {}): Animation {
    return this.start(
      decay(this.#value, { ...options, velocity: options.velocity ?? this.velocity }),
    );
  }

  /** Runs any motion. Elapsed time starts at 0 on the next frame. */
  start(motion: Motion): Animation {
    this.#halt(false);
    if (reducedMotion()) {
      this.jump(restValue(motion));
      return settled(true);
    }
    let elapsed = 0;
    let resolve!: (completed: boolean) => void;
    const finished = new Promise<boolean>((r) => {
      resolve = r;
    });
    this.#resolve = resolve;
    const remove = loop.add((dt) => {
      elapsed += dt;
      const state = motion(elapsed);
      this.#velocity = state.velocity;
      this.#emit(state.value);
      if (state.done) this.#halt(true);
    });
    this.#cancel = remove;
    this.#tracked = false;
    this.#tracker.reset();
    return {
      finished,
      stop: () => {
        if (this.#resolve === resolve) this.#halt(false);
      },
    };
  }

  /** Stops where it is. The velocity is kept, so a following `to` or `throw` continues it. */
  stop(): void {
    this.#halt(false);
  }

  /** Calls `listener` on every change. Returns the unsubscribe function. */
  on(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #emit(value: number): void {
    this.#value = value;
    for (const listener of [...this.#listeners]) listener(value, this.#velocity);
  }

  #halt(completed: boolean): void {
    const cancel = this.#cancel;
    const resolve = this.#resolve;
    this.#cancel = null;
    this.#resolve = null;
    if (cancel) {
      cancel();
      // Interrupted motions keep their momentum for whatever comes next.
      if (completed) this.#velocity = 0;
    }
    resolve?.(completed);
  }
}

/** Creates a value with momentum. */
export function value(initial = 0): PhysicsValue {
  return new PhysicsValue(initial);
}
