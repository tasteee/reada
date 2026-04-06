import { describe, expect, test } from "bun:test";
import { reada } from "../../index.ts";

describe("array store helpers", () => {
  test("append adds value to the end", () => {
    const $tags = reada.store(["typescript"]);

    $tags.append("dx");

    expect($tags.state).toEqual(["typescript", "dx"]);
  });

  test("prepend adds value to the start", () => {
    const $tags = reada.store(["dx"]);

    $tags.prepend("typescript");

    expect($tags.state).toEqual(["typescript", "dx"]);
  });

  test("remove removes all values matching predicate", () => {
    const $tags = reada.store(["dx", "typescript", "dx"]);

    $tags.remove((tagValue) => {
      const isMatchingTag = tagValue === "dx";
      return isMatchingTag;
    });

    expect($tags.state).toEqual(["typescript"]);
  });

  test("filter keeps only values matching predicate", () => {
    const $tags = reada.store(["a", "ab", "abc"]);

    $tags.filter((tagValue) => {
      const isLongerThanOneCharacter = tagValue.length > 1;
      return isLongerThanOneCharacter;
    });

    expect($tags.state).toEqual(["ab", "abc"]);
  });

  test("map transforms each value and writes a new array", () => {
    const initialTagList = ["dx", "ts"];
    const $tags = reada.store(initialTagList);

    $tags.map((tagValue) => {
      const upperTagValue = tagValue.toUpperCase();
      return upperTagValue;
    });

    expect($tags.state).toEqual(["DX", "TS"]);
    expect($tags.state).not.toBe(initialTagList);
  });
});