import { loop } from "@sweberdev/lagrangian";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { useBody, useDraggable, useScroller, useSpring, useSpringProps, useWorld } from "../src";

const frames = async (n: number) => {
  for (let i = 0; i < n; i++) loop.step(1000 / 60);
  await nextTick();
};

beforeEach(() => loop.manual(true));
afterEach(() => {
  loop.manual(false);
  document.body.replaceChildren();
});

function mount(component: ReturnType<typeof defineComponent>) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const app = createApp(component);
  app.mount(host);
  return { host, app };
}

describe("vue", () => {
  it("useSpring follows the target and renders it", async () => {
    const target = ref(0);
    const Counter = defineComponent({
      setup() {
        const n = useSpring(target, { duration: 0.3 });
        return () => h("span", Math.round(n.value));
      },
    });
    const { host, app } = mount(Counter);
    expect(host.textContent).toBe("0");
    target.value = 100;
    await nextTick();
    await frames(120);
    expect(host.textContent).toBe("100");
    app.unmount();
  });

  it("useSpringProps animates the element and follows changing props", async () => {
    const open = ref(false);
    const Box = defineComponent({
      setup() {
        const el = ref<HTMLElement>();
        useSpringProps(el, () => ({ x: open.value ? 200 : 0 }));
        return () => h("div", { ref: el, "data-testid": "box" });
      },
    });
    const { host, app } = mount(Box);
    await nextTick();
    open.value = true;
    await nextTick();
    await frames(200);
    expect((host.firstElementChild as HTMLElement).style.transform).toBe(
      "translate3d(200px, 0px, 0px)",
    );
    app.unmount();
  });

  it("useDraggable attaches, drags and detaches", async () => {
    const holder: { handle?: ReturnType<typeof useDraggable> } = {};
    const Handle = defineComponent({
      setup() {
        const el = ref<HTMLElement>();
        holder.handle = useDraggable(el, { axis: "y" });
        return () => h("div", { ref: el });
      },
    });
    const { host, app } = mount(Handle);
    await nextTick();
    expect(holder.handle?.value).not.toBeNull();
    const el = host.firstElementChild as HTMLElement;
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
    await frames(1);
    expect(el.style.transform).toBe("translate3d(0px, 40px, 0px)");
    app.unmount();
    expect(holder.handle?.value).toBeNull();
  });

  it("useScroller scrolls and cleans up", async () => {
    const holder: { handle?: ReturnType<typeof useScroller> } = {};
    const Area = defineComponent({
      setup() {
        const el = ref<HTMLElement>();
        holder.handle = useScroller(el);
        return () => h("div", { ref: el }, [h("div")]);
      },
    });
    const { host, app } = mount(Area);
    await nextTick();
    const viewport = host.firstElementChild as HTMLElement;
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 100 });
    Object.defineProperty(viewport.firstElementChild, "scrollHeight", {
      configurable: true,
      value: 500,
    });
    holder.handle?.value?.scrollTo({ y: 200 });
    await frames(120);
    expect(holder.handle?.value?.position.y).toBeCloseTo(200, 1);
    expect(viewport.style.overflow).toBe("hidden");
    app.unmount();
    expect(viewport.style.overflow).toBe("");
  });

  it("useWorld and useBody let an element fall", async () => {
    const Scene = defineComponent({
      setup() {
        const stage = ref<HTMLElement>();
        const ball = ref<HTMLElement>();
        const world = useWorld(stage, { interactive: false });
        useBody(world, ball, { x: 40, y: 40, radius: 10 });
        return () =>
          h("div", { ref: stage }, [h("div", { ref: ball, style: { position: "absolute" } })]);
      },
    });
    const { host, app } = mount(Scene);
    const stage = host.firstElementChild as HTMLElement;
    Object.defineProperty(stage, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(stage, "clientHeight", { configurable: true, value: 300 });
    await nextTick();
    await nextTick();
    await frames(30);
    const ball = stage.firstElementChild as HTMLElement;
    const y = Number.parseFloat(ball.style.transform.split(",")[1] ?? "0");
    expect(y).toBeGreaterThan(30);
    app.unmount();
  });
});
