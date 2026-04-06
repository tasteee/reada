import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reada } from "../index.ts";

describe("store.use.at path subscription", () => {
  test("returns value at path on initial render", () => {
    const $user = reada.store({
      address: {
        city: "Austin",
      },
    });

    const renderedHook = renderHook(() => $user.use.at("address.city"));

    expect(renderedHook.result.current).toBe("Austin");
  });

  test("re-renders when value at path changes", () => {
    const $user = reada.store({
      address: {
        city: "Austin",
      },
    });
    let renderCount = 0;

    const renderedHook = renderHook(() => {
      renderCount += 1;
      const cityValue = $user.use.at("address.city");
      return cityValue;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $user.at("address.city", "Dallas");
    });

    expect(renderedHook.result.current).toBe("Dallas");
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test("does not re-render when different path changes", () => {
    const $user = reada.store({
      email: "grace@reada.dev",
      address: {
        city: "Austin",
      },
    });
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      const cityValue = $user.use.at("address.city");
      return cityValue;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $user.at("email", "ada@reada.dev");
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test("supports deep dot-notation paths", () => {
    const $profile = reada.store({
      account: {
        address: {
          city: "Austin",
        },
      },
    });

    const renderedHook = renderHook(() => $profile.use.at("account.address.city"));

    act(() => {
      $profile.at("account.address.city", "Tokyo");
    });

    expect(renderedHook.result.current).toBe("Tokyo");
  });

  test("supports array index notation in object paths", () => {
    const $user = reada.store({
      tags: ["first", "second", "third"],
    });

    const renderedHook = renderHook(() => $user.use.at("tags.1"));

    act(() => {
      $user.at("tags.1", "updated");
    });

    expect(renderedHook.result.current).toBe("updated");
  });
});