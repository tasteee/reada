import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reada } from "../index.ts";

describe("array store use.filter", () => {
  test("returns filtered array on initial render", () => {
    const $nameList = reada.store(["hannah", "kensie", "patty"]);

    const renderedHook = renderHook(() =>
      $nameList.use.filter((nameValue) => {
        const isHName = nameValue.startsWith("h");
        return isHName;
      }),
    );

    expect(renderedHook.result.current).toEqual(["hannah"]);
  });

  test("re-renders when filtered result changes", () => {
    const $nameList = reada.store(["hannah", "kensie"]);
    let renderCount = 0;

    const renderedHook = renderHook(() => {
      renderCount += 1;
      const filteredNameList = $nameList.use.filter((nameValue) => {
        const isHName = nameValue.startsWith("h");
        return isHName;
      });
      return filteredNameList;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $nameList.append("harper");
    });

    expect(renderedHook.result.current).toEqual(["hannah", "harper"]);
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test("does not re-render when store changes but filtered result stays equal", () => {
    const $nameList = reada.store(["hannah", "kensie"]);
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      const filteredNameList = $nameList.use.filter((nameValue) => {
        const isHName = nameValue.startsWith("h");
        return isHName;
      });
      return filteredNameList;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $nameList.append("patty");
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test("returns new array reference only when filtered content changes", () => {
    const $nameList = reada.store(["hannah", "patty"]);

    const renderedHook = renderHook(() =>
      $nameList.use.filter((nameValue) => {
        const isHName = nameValue.startsWith("h");
        return isHName;
      }),
    );

    const firstReference = renderedHook.result.current;

    act(() => {
      $nameList.write(["hannah", "penny"]);
    });

    const secondReference = renderedHook.result.current;

    act(() => {
      $nameList.write(["hannah", "henry", "penny"]);
    });

    const thirdReference = renderedHook.result.current;

    expect(secondReference).toBe(firstReference);
    expect(thirdReference).not.toBe(secondReference);
  });
});