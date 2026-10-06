// Estimates velocity from recent samples with a least-squares line over the last 100 ms,
// which is far less jittery than the difference of the last two pointer events.

const WINDOW = 100;
const STALE = 60;

export class VelocityTracker {
  #samples: { t: number; x: number }[] = [];

  /** Adds a sample: `time` in milliseconds, `value` in any unit. */
  add(time: number, value: number): void {
    const samples = this.#samples;
    const last = samples[samples.length - 1];
    if (last && time <= last.t) {
      last.x = value;
      return;
    }
    samples.push({ t: time, x: value });
    while (samples.length > 2 && (samples[0] as { t: number }).t < time - WINDOW) samples.shift();
  }

  /** Velocity in units per second at `time` (ms). 0 when the pointer has been resting. */
  velocity(time?: number): number {
    const samples = this.#samples;
    const last = samples[samples.length - 1];
    if (!last || samples.length < 2) return 0;
    if (time !== undefined && time - last.t > STALE) return 0;
    const recent = samples.filter((s) => s.t >= last.t - WINDOW);
    if (recent.length < 2) return 0;
    let mt = 0;
    let mx = 0;
    for (const s of recent) {
      mt += s.t;
      mx += s.x;
    }
    mt /= recent.length;
    mx /= recent.length;
    let num = 0;
    let den = 0;
    for (const s of recent) {
      num += (s.t - mt) * (s.x - mx);
      den += (s.t - mt) * (s.t - mt);
    }
    return den === 0 ? 0 : (num / den) * 1000;
  }

  reset(): void {
    this.#samples = [];
  }
}
