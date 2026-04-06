import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reada } from "../index.ts";

describe("array store use.map", () => {
  test("returns mapped array on initial render", () => {
    const $nameList = reada.store(["hannah", "kensie"]);

    const renderedHook = renderHook(() =>
      $nameList.use.map((nameValue) => {
        const upperName = nameValue.toUpperCase();
        return upperName;
      }),
    );

    expect(renderedHook.result.current).toEqual(["HANNAH", "KENSIE"]);
  });

  test("re-renders when mapped result changes", () => {
    const $nameList = reada.store(["ab", "cd"]);
    let renderCount = 0;

    const renderedHook = renderHook(() => {
      renderCount += 1;
      const mappedLengthList = $nameList.use.map((nameValue) => {
        const nameLength = nameValue.length;
        return nameLength;
      });
      return mappedLengthList;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $nameList.write(["ab", "cde"]);
    });

    expect(renderedHook.result.current).toEqual([2, 3]);
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test("does not re-render when store changes but mapped result stays equal", () => {
    const $nameList = reada.store(["ab", "cd"]);
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      const mappedLengthList = $nameList.use.map((nameValue) => {
        const nameLength = nameValue.length;
        return nameLength;
      });
      return mappedLengthList;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $nameList.write(["ef", "gh"]);
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test("returns new array reference only when mapped content changes", () => {
    const $nameList = reada.store(["ab", "cd"]);

    const renderedHook = renderHook(() =>
      $nameList.use.map((nameValue) => {
        const nameLength = nameValue.length;
        return nameLength;
      }),
    );

    const firstReference = renderedHook.result.current;

    act(() => {
      $nameList.write(["ef", "gh"]);
    });

    const secondReference = renderedHook.result.current;

    act(() => {
      $nameList.write(["ijk", "l"]);
    });

    const thirdReference = renderedHook.result.current;

    expect(secondReference).toBe(firstReference);
    expect(thirdReference).not.toBe(secondReference);
  });
});