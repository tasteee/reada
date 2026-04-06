import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { reada } from "../index.ts";

describe("store.use full state subscription", () => {
  test("returns current state on initial render", () => {
    const $name = reada.store("grace");

    const renderedHook = renderHook(() => $name.use());

    expect(renderedHook.result.current).toBe("grace");
  });

  test("triggers re-render when store state changes", () => {
    const $count = reada.store(0);
    let renderCount = 0;

    const renderedHook = renderHook(() => {
      renderCount += 1;
      const countValue = $count.use();
      return countValue;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $count.write(1);
    });

    expect(renderedHook.result.current).toBe(1);
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test("does not trigger re-render when state write is equal", () => {
    const $count = reada.store(2);
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      const countValue = $count.use();
      return countValue;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $count.write(2);
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test("works for string, number, boolean, object, and array stores", () => {
    const $name = reada.store("grace");
    const $count = reada.store(0);
    const $isReady = reada.store(false);
    const $user = reada.store({ email: "grace@reada.dev", role: "guest" });
    const $tagList = reada.store(["typescript"]);

    const renderedNameHook = renderHook(() => $name.use());
    const renderedCountHook = renderHook(() => $count.use());
    const renderedReadyHook = renderHook(() => $isReady.use());
    const renderedUserHook = renderHook(() => $user.use());
    const renderedTagListHook = renderHook(() => $tagList.use());

    expect(renderedNameHook.result.current).toBe("grace");
    expect(renderedCountHook.result.current).toBe(0);
    expect(renderedReadyHook.result.current).toBe(false);
    expect(renderedUserHook.result.current).toEqual({ email: "grace@reada.dev", role: "guest" });
    expect(renderedTagListHook.result.current).toEqual(["typescript"]);
  });

  test("multiple subscribers to one store all receive updates", () => {
    const $count = reada.store(0);
    let firstRenderCount = 0;
    let secondRenderCount = 0;

    const firstRenderedHook = renderHook(() => {
      firstRenderCount += 1;
      const countValue = $count.use();
      return countValue;
    });

    const secondRenderedHook = renderHook(() => {
      secondRenderCount += 1;
      const countValue = $count.use();
      return countValue;
    });

    const firstInitialRenderCount = firstRenderCount;
    const secondInitialRenderCount = secondRenderCount;

    act(() => {
      $count.write(5);
    });

    expect(firstRenderedHook.result.current).toBe(5);
    expect(secondRenderedHook.result.current).toBe(5);
    expect(firstRenderCount).toBe(firstInitialRenderCount + 1);
    expect(secondRenderCount).toBe(secondInitialRenderCount + 1);
  });
});

describe("store.use selector subscription", () => {
  test("returns selector result on initial render", () => {
    const $user = reada.store({ email: "grace@reada.dev", role: "guest" });

    const renderedHook = renderHook(() => $user.use((stateValue) => stateValue.email));

    expect(renderedHook.result.current).toBe("grace@reada.dev");
  });

  test("triggers re-render when selector result changes", () => {
    const $user = reada.store({ email: "grace@reada.dev", role: "guest" });
    let renderCount = 0;

    const renderedHook = renderHook(() => {
      renderCount += 1;
      const selectedEmail = $user.use((stateValue) => stateValue.email);
      return selectedEmail;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $user.at("email", "ada@reada.dev");
    });

    expect(renderedHook.result.current).toBe("ada@reada.dev");
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test("does not re-render when selector result stays equal", () => {
    const $user = reada.store({ email: "grace@reada.dev", role: "guest" });
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      const selectedEmail = $user.use((stateValue) => stateValue.email);
      return selectedEmail;
    });

    const initialRenderCount = renderCount;

    act(() => {
      $user.at("role", "admin");
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test("selector receives full current state", () => {
    const $user = reada.store({ email: "grace@reada.dev", role: "guest" });
    const receivedStateList: Array<{ email: string; role: string }> = [];

    renderHook(() =>
      $user.use((stateValue) => {
        receivedStateList.push(stateValue);
        const emailValue = stateValue.email;
        return emailValue;
      }),
    );

    act(() => {
      $user.write((stateValue) => ({ ...stateValue, email: "ada@reada.dev" }));
    });

    const hasInitialState = receivedStateList.some((stateValue) => {
      const isInitialEmail = stateValue.email === "grace@reada.dev";
      const isInitialRole = stateValue.role === "guest";
      const isInitialState = isInitialEmail && isInitialRole;
      return isInitialState;
    });

    const hasUpdatedState = receivedStateList.some((stateValue) => {
      const isUpdatedEmail = stateValue.email === "ada@reada.dev";
      const isUpdatedRole = stateValue.role === "guest";
      const isUpdatedState = isUpdatedEmail && isUpdatedRole;
      return isUpdatedState;
    });

    expect(hasInitialState).toBe(true);
    expect(hasUpdatedState).toBe(true);
  });

  test("selectors can return primitives, objects, and arrays", () => {
    const profileStateValue = { plan: "pro" };
    const tagList = ["typescript"];

    const $user = reada.store({
      email: "grace@reada.dev",
      profile: profileStateValue,
      tags: tagList,
    });

    const renderedPrimitiveHook = renderHook(() => $user.use((stateValue) => stateValue.email));
    const renderedObjectHook = renderHook(() => $user.use((stateValue) => stateValue.profile));
    const renderedArrayHook = renderHook(() => $user.use((stateValue) => stateValue.tags));

    expect(renderedPrimitiveHook.result.current).toBe("grace@reada.dev");
    expect(renderedObjectHook.result.current).toEqual({ plan: "pro" });
    expect(renderedArrayHook.result.current).toEqual(["typescript"]);
  });
});

describe("rules of hooks", () => {
  test("calling use outside a component throws React hook error", () => {
    const callHookOutsideComponent = (): void => {
      const $count = reada.store(0);
      $count.use();
    };

    expect(callHookOutsideComponent).toThrow(/hook/i);
  });

  test("calling use conditionally produces React hook order error", () => {
    const $count = reada.store(0);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // This test intentionally triggers a React runtime hook-order error.
    });

    const renderedHook = renderHook(({ shouldUseStore }: { shouldUseStore: boolean }) => {
      if (shouldUseStore) {
        const countValue = $count.use();
        return countValue;
      }

      return -1;
    }, {
      initialProps: {
        shouldUseStore: true,
      },
    });

    const breakHookOrder = (): void => {
      renderedHook.rerender({
        shouldUseStore: false,
      });
    };

    expect(breakHookOrder).toThrow(/rendered fewer hooks|hook/i);

    consoleErrorSpy.mockRestore();
  });
});