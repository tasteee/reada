import { describe, expect, test } from "bun:test";
import { reada } from "../../index.ts";

describe("boolean store helpers", () => {
  test("toggle flips false to true", () => {
    const $isMenuOpen = reada.store(false);

    $isMenuOpen.toggle();

    expect($isMenuOpen.state).toBe(true);
  });

  test("toggle flips true to false", () => {
    const $isMenuOpen = reada.store(true);

    $isMenuOpen.toggle();

    expect($isMenuOpen.state).toBe(false);
  });

  test("on sets state to true", () => {
    const $isMenuOpen = reada.store(false);

    $isMenuOpen.on();

    expect($isMenuOpen.state).toBe(true);
  });

  test("on is idempotent when state is already true", () => {
    const $isMenuOpen = reada.store(true);
    const notificationList: boolean[] = [];

    const stop = reada.effect([$isMenuOpen], ([isMenuOpenState]) => {
      notificationList.push(isMenuOpenState);
    });

    $isMenuOpen.on();

    expect(notificationList).toHaveLength(0);

    stop();
  });

  test("off sets state to false", () => {
    const $isMenuOpen = reada.store(true);

    $isMenuOpen.off();

    expect($isMenuOpen.state).toBe(false);
  });

  test("off is idempotent when state is already false", () => {
    const $isMenuOpen = reada.store(false);
    const notificationList: boolean[] = [];

    const stop = reada.effect([$isMenuOpen], ([isMenuOpenState]) => {
      notificationList.push(isMenuOpenState);
    });

    $isMenuOpen.off();

    expect(notificationList).toHaveLength(0);

    stop();
  });
});