import { describe, expect, test } from "bun:test";
import { reada } from "../../index.ts";

describe("number store helpers", () => {
  test("increment with no argument increases by one", () => {
    const $count = reada.store(0);

    $count.increment();

    expect($count.state).toBe(1);
  });

  test("increment with argument increases by provided amount", () => {
    const $count = reada.store(0);

    $count.increment(5);

    expect($count.state).toBe(5);
  });

  test("decrement with no argument decreases by one", () => {
    const $count = reada.store(4);

    $count.decrement();

    expect($count.state).toBe(3);
  });

  test("decrement with argument decreases by provided amount", () => {
    const $count = reada.store(10);

    $count.decrement(3);

    expect($count.state).toBe(7);
  });

  test("increment throws when step is negative", () => {
    const $count = reada.store(0);

    const incrementWithNegativeStep = () => {
      $count.increment(-1);
    };

    expect(incrementWithNegativeStep).toThrow("reada: step must be a positive number.");
  });

  test("decrement throws when step is negative", () => {
    const $count = reada.store(0);

    const decrementWithNegativeStep = () => {
      $count.decrement(-1);
    };

    expect(decrementWithNegativeStep).toThrow("reada: step must be a positive number.");
  });
});