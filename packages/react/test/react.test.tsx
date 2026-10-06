import { loop } from "@sweberdev/lagrangian";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useBody, useDraggable, useSpring, useSpringProps, useValue, useWorld } from "../src";

const frames = (n: number) =>
  act(async () => {
    for (let i = 0; i < n; i++) loop.step(1000 / 60);
    await new Promise((r) => setTimeout(r, 0));
  });

beforeEach(() => loop.manual(true));
afterEach(() => loop.manual(false));

describe("react", () => {
  it("useSpring follows the target and useValue renders it", async () => {
    function Counter({ to }: { to: number }) {
      const v = useSpring(to, { duration: 0.3 });
      return <span>{Math.round(useValue(v))}</span>;
    }
    const { container, rerender } = render(<Counter to={0} />);
    expect(container.textContent).toBe("0");
    rerender(<Counter to={100} />);
    await frames(120);
    expect(container.textContent).toBe("100");
  });

  it("useSpringProps animates the element", async () => {
    function Box({ open }: { open: boolean }) {
      const ref = useSpringProps<HTMLDivElement>({ x: open ? 200 : 0 });
      return <div data-testid="box" ref={ref} />;
    }
    const { getByTestId, rerender } = render(<Box open={false} />);
    rerender(<Box open />);
    await frames(200);
    expect(getByTestId("box").style.transform).toBe("translate3d(200px, 0px, 0px)");
  });

  it("useDraggable attaches and detaches", () => {
    function Handle() {
      const [ref] = useDraggable<HTMLDivElement>({ axis: "y" });
      return <div data-testid="handle" ref={ref} />;
    }
    const { getByTestId, unmount } = render(<Handle />);
    const el = getByTestId("handle");
    const pointer = (type: string, y: number) =>
      el.dispatchEvent(
        Object.assign(new Event(type), {
          pointerId: 1,
          pointerType: "touch",
          clientX: 0,
          clientY: y,
        }),
      );
    pointer("pointerdown", 0);
    pointer("pointermove", 40);
    pointer("pointerup", 40);
    expect(el.style.transform).toBe("");
    return frames(1).then(() => {
      expect(el.style.transform).toBe("translate3d(0px, 40px, 0px)");
      unmount();
      pointer("pointerdown", 40);
      pointer("pointermove", 90);
      return frames(1).then(() => expect(el.style.transform).toBe("translate3d(0px, 40px, 0px)"));
    });
  });

  it("useWorld and useBody simulate bodies in the container", async () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => 400,
    });
    function Scene() {
      const [ref, world] = useWorld<HTMLDivElement>();
      const [ball] = useBody<HTMLDivElement>(world, { x: 50, y: 50, radius: 10 });
      return (
        <div ref={ref}>
          <div data-testid="ball" ref={ball} />
        </div>
      );
    }
    const { getByTestId } = render(<Scene />);
    // Let React finish attaching the refs before stepping the loop.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await frames(10);
    const transform = getByTestId("ball").style.transform;
    expect(transform).toMatch(/^translate3d\(40px, /);
    const y = Number.parseFloat(transform.split(",")[1] ?? "0");
    expect(y).toBeGreaterThan(40);
  });
});
