import { loop } from "@sweberdev/lagrangian";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useScroller } from "../src";

const frames = (n: number) =>
  act(async () => {
    for (let i = 0; i < n; i++) loop.step(1000 / 60);
    await new Promise((r) => setTimeout(r, 0));
  });

beforeEach(() => loop.manual(true));
afterEach(() => loop.manual(false));

describe("useScroller", () => {
  it("scrolls the content and cleans up", async () => {
    let handle: ReturnType<typeof useScroller<HTMLDivElement>>[1] = null;
    function Area() {
      const [ref, s] = useScroller<HTMLDivElement>();
      handle = s;
      return (
        <div ref={ref} data-testid="viewport">
          <div data-testid="content" />
        </div>
      );
    }
    const { getByTestId, unmount } = render(<Area />);
    const viewport = getByTestId("viewport");
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 100 });
    Object.defineProperty(getByTestId("content"), "scrollHeight", {
      configurable: true,
      value: 500,
    });
    await frames(1);
    const s = handle as unknown as { scrollTo(p: { y: number }): void; position: { y: number } };
    s.scrollTo({ y: 200 });
    await frames(120);
    expect(s.position.y).toBeCloseTo(200, 1);
    expect(viewport.style.overflow).toBe("hidden");
    unmount();
  });
});
