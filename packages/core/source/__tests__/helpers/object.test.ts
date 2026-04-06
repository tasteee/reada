import { describe, expect, test } from "bun:test";
import { reada } from "../../index.ts";

describe("object store helpers", () => {
  test("patch merges top-level keys and preserves unspecified keys", () => {
    const $user = reada.store({ email: "", role: "guest", city: "Austin" });

    $user.patch({ role: "admin" });

    expect($user.state).toEqual({ email: "", role: "admin", city: "Austin" });
  });

  test("patch does not deep merge nested objects", () => {
    const $user = reada.store({
      role: "guest",
      address: {
        city: "Austin",
        zipCode: "78701",
      },
    });

    $user.patch({
      address: {
        city: "Dallas",
      },
    });

    const userStateValue = $user.state as unknown as {
      role: string;
      address: {
        city: string;
        zipCode?: string;
      };
    };

    expect(userStateValue.role).toBe("guest");
    expect(userStateValue.address.city).toBe("Dallas");
    expect(userStateValue.address.zipCode).toBeUndefined();
  });

  test("at sets a top-level key", () => {
    const $user = reada.store({ email: "", role: "guest" });

    $user.at("email", "grace@reada.dev");

    expect($user.state.email).toBe("grace@reada.dev");
  });

  test("at sets a nested key using dot notation", () => {
    const $user = reada.store({
      address: {
        city: "",
      },
    });

    $user.at("address.city", "Austin");

    expect($user.state.address.city).toBe("Austin");
  });

  test("at sets an array index inside object state", () => {
    const $user = reada.store({
      tags: ["first", "second", "third"],
    });

    $user.at("tags.1", "updated");

    expect($user.state.tags).toEqual(["first", "updated", "third"]);
  });

  test("at(path) returns a curried setter function", () => {
    const $user = reada.store({ email: "" });

    const setEmail = $user.at("email");

    expect(typeof setEmail).toBe("function");
  });

  test("curried setter updates state when called", () => {
    const $user = reada.store({ email: "" });

    const setEmail = $user.at("email");
    setEmail("grace@reada.dev");

    expect($user.state.email).toBe("grace@reada.dev");
  });
});