import { describe, expect, test } from "bun:test";
import { reada } from "../index.ts";

describe("reada.derived", () => {
  test("value returns selector result", () => {
    const $name = reada.store("grace");
    const $greeting = reada.derived([$name], ([nameState]) => {
      const greetingMessage = `Hello, ${nameState}`;
      return greetingMessage;
    });

    expect($greeting.value).toBe("Hello, grace");
  });

  test("value updates when a source store changes", () => {
    const $name = reada.store("grace");
    const $greeting = reada.derived([$name], ([nameState]) => {
      const greetingMessage = `Hello, ${nameState}`;
      return greetingMessage;
    });

    $name.write("ada");

    expect($greeting.value).toBe("Hello, ada");
  });

  test("value reflects the latest source store state", () => {
    const $count = reada.store(0);
    const $summary = reada.derived([$count], ([countState]) => {
      const summaryMessage = `count:${countState}`;
      return summaryMessage;
    });

    $count.write(1);
    $count.write(2);
    $count.write(3);

    expect($summary.value).toBe("count:3");
  });

  test("derived store is lazy until value is accessed", () => {
    const $name = reada.store("grace");
    const selectorRunNameList: string[] = [];

    const $greeting = reada.derived([$name], ([nameState]) => {
      selectorRunNameList.push(nameState);

      const greetingMessage = `Hello, ${nameState}`;
      return greetingMessage;
    });

    $name.write("ada");

    expect(selectorRunNameList).toHaveLength(0);
    expect($greeting.value).toBe("Hello, ada");
    expect(selectorRunNameList).toEqual(["ada"]);
  });

  test("derived recomputes and notifies when an observer is active", () => {
    const $name = reada.store("grace");
    const $greeting = reada.derived([$name], ([nameState]) => {
      const greetingMessage = `Hello, ${nameState}`;
      return greetingMessage;
    });
    const receivedGreetingList: string[] = [];

    const stop = reada.effect([$greeting], ([greetingState]) => {
      receivedGreetingList.push(greetingState);
    });

    $name.write("ada");

    expect(receivedGreetingList).toEqual(["Hello, ada"]);

    stop();
  });

  test("derived store does not expose write or reset properties at runtime", () => {
    const $name = reada.store("grace");
    const $greeting = reada.derived([$name], ([nameState]) => {
      const greetingMessage = `Hello, ${nameState}`;
      return greetingMessage;
    });

    const hasWriteProperty = "write" in ($greeting as Record<string, unknown>);
    const hasResetProperty = "reset" in ($greeting as Record<string, unknown>);

    expect(hasWriteProperty).toBe(false);
    expect(hasResetProperty).toBe(false);
  });
});