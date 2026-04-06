import { describe, expect, test } from "bun:test";
import { reada } from "../index.ts";

describe("reada.effect", () => {
  test("callback fires on store change", () => {
    const $name = reada.store("grace");
    const receivedNameList: string[] = [];

    const stop = reada.effect([$name], ([nameState]) => {
      receivedNameList.push(nameState);
    });

    $name.write("ada");

    expect(receivedNameList).toEqual(["ada"]);

    stop();
  });

  test("callback receives tuple of all listed store states", () => {
    const $name = reada.store("grace");
    const $count = reada.store(0);
    const receivedTupleList: Array<readonly [string, number]> = [];

    const stop = reada.effect([$name, $count], (tupleState) => {
      receivedTupleList.push(tupleState);
    });

    $name.write("ada");
    $count.write(2);

    expect(receivedTupleList).toEqual([
      ["ada", 0],
      ["ada", 2],
    ]);

    stop();
  });

  test("callback does not fire on initial subscription", () => {
    const $name = reada.store("grace");
    const receivedNameList: string[] = [];

    const stop = reada.effect([$name], ([nameState]) => {
      receivedNameList.push(nameState);
    });

    expect(receivedNameList).toHaveLength(0);

    stop();
  });

  test("stop prevents future callback invocations", () => {
    const $name = reada.store("grace");
    const receivedNameList: string[] = [];

    const stop = reada.effect([$name], ([nameState]) => {
      receivedNameList.push(nameState);
    });

    stop();

    $name.write("ada");

    expect(receivedNameList).toHaveLength(0);
  });

  test("stop can be called multiple times safely", () => {
    const $name = reada.store("grace");
    const stop = reada.effect([$name], () => {
      // Intentionally empty: this test only validates stop idempotency.
    });

    const stopEffectTwice = () => {
      stop();
      stop();
    };

    expect(stopEffectTwice).not.toThrow();
  });

  test("callback fires when any listed store changes", () => {
    const $name = reada.store("grace");
    const $count = reada.store(0);
    const receivedTupleList: Array<readonly [string, number]> = [];

    const stop = reada.effect([$name, $count], (tupleState) => {
      receivedTupleList.push(tupleState);
    });

    $name.write("ada");
    $count.write(1);

    expect(receivedTupleList).toHaveLength(2);

    stop();
  });
});