import { describe, expect, test } from "bun:test";
import { reada } from "../index.ts";

describe("reada.store", () => {
  test("string store starts with its initial state", () => {
    const $name = reada.store("");

    expect($name.state).toBe("");
  });

  test("number store starts with its initial state", () => {
    const $count = reada.store(0);

    expect($count.state).toBe(0);
  });

  test("boolean store starts with its initial state", () => {
    const $isLoading = reada.store(false);

    expect($isLoading.state).toBe(false);
  });

  test("object store starts with its initial state", () => {
    const $user = reada.store({ email: "", role: "guest" });

    expect($user.state).toEqual({ email: "", role: "guest" });
  });

  test("array store starts with its initial state", () => {
    const $tags = reada.store<string[]>([]);

    expect($tags.state).toEqual([]);
  });

  test("direct value write updates state", () => {
    const $name = reada.store("grace");

    $name.write("ada");

    expect($name.state).toBe("ada");
  });

  test("synchronous updater receives current state and returns next state", () => {
    const $count = reada.store(1);
    const receivedStateList: number[] = [];

    $count.write((state) => {
      receivedStateList.push(state);

      const nextCount = state + 1;
      return nextCount;
    });

    const firstReceivedState = receivedStateList[0];

    expect(firstReceivedState).toBe(1);
    expect($count.state).toBe(2);
  });

  test("async updater resolves before state updates", async () => {
    const $name = reada.store("grace");

    const writePromise = $name.write(async (state) => {
      await Promise.resolve();

      const upperName = state.toUpperCase();
      return upperName;
    });

    expect($name.state).toBe("grace");

    await writePromise;

    expect($name.state).toBe("GRACE");
  });

  test("async updater rejection leaves state unchanged and rejection propagates", async () => {
    const $name = reada.store("grace");
    const errorMessage = "network failed";

    const writePromise = $name.write(async () => {
      throw new Error(errorMessage);
    });

    await expect(writePromise).rejects.toThrow(errorMessage);
    expect($name.state).toBe("grace");
  });

  test("observers are not notified when next state equals current state", () => {
    const $count = reada.store(3);
    const $user = reada.store({ email: "grace@reada.dev" });
    const notificationStateList: Array<number | { email: string }> = [];

    const stopCount = reada.effect([$count], ([countState]) => {
      notificationStateList.push(countState);
    });

    const stopUser = reada.effect([$user], ([userState]) => {
      notificationStateList.push(userState);
    });

    $count.write(3);

    const currentUserState = $user.state;
    $user.write(currentUserState);

    expect(notificationStateList).toHaveLength(0);

    stopCount();
    stopUser();
  });

  test("assigning .state directly throws a descriptive error", () => {
    const $name = reada.store("grace");

    const assignStateDirectly = () => {
      const writableView = $name as unknown as { state: string };
      writableView.state = "ada";
    };

    expect(assignStateDirectly).toThrow("reada: .state is read-only. Use .write() to update state.");
  });

  test("reset restores initial value after one write", () => {
    const $name = reada.store("");

    $name.write("grace");
    $name.reset();

    expect($name.state).toBe("");
  });

  test("reset restores initial value after multiple writes", () => {
    const $count = reada.store(0);

    $count.write(1);
    $count.write(2);
    $count.write(3);
    $count.reset();

    expect($count.state).toBe(0);
  });

  test("observers are notified on reset when state changed", () => {
    const $count = reada.store(0);
    const notificationList: number[] = [];

    $count.write(5);

    const stop = reada.effect([$count], ([countState]) => {
      notificationList.push(countState);
    });

    $count.reset();

    expect(notificationList).toEqual([0]);

    stop();
  });

  test("observers are not notified on reset when state is already initial", () => {
    const $count = reada.store(0);
    const notificationList: number[] = [];

    const stop = reada.effect([$count], ([countState]) => {
      notificationList.push(countState);
    });

    $count.reset();

    expect(notificationList).toHaveLength(0);

    stop();
  });
});