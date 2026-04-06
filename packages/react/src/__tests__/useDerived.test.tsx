import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reada } from "../index.ts";

describe("derived store use", () => {
  test("returns derived value on initial render", () => {
    const $name = reada.store("grace");
    const $greeting = reada.derived([$name], ([nameValue]) => {
      const greetingValue = `Hello, ${nameValue}`;
      return greetingValue;
    });

    const renderedHook = renderHook(() => $greeting.use());

    expect(renderedHook.result.current).toBe("Hello, grace");
  });

  test("re-renders when derived value changes", () => {
    const $name = reada.store("grace");
    const $greeting = reada.derived([$name], ([nameValue]) => {
      const greetingValue = `Hello, ${nameValue}`;
      return greetingValue;
    });
    let renderCount = 0;

    const renderedHook = renderHook(() => {
      renderCount += 1;
      const greetingValue = $greeting.use();
      return greetingValue;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $name.write("ada");
    });

    expect(renderedHook.result.current).toBe("Hello, ada");
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test("does not re-render when source changes but derived value stays equal", () => {
    const $count = reada.store(0);
    const $isEven = reada.derived([$count], ([countValue]) => {
      const isEvenValue = countValue % 2 === 0;
      return isEvenValue;
    });
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      const evenState = $isEven.use();
      return evenState;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $count.write(2);
    });

    expect(renderCount).toBe(initialRenderCount);
  });
});