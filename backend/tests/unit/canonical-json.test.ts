import { describe, expect, it } from "vitest";
import { canonicalJsonStringify, computeCanonicalHash } from "../../src/shared/utils/canonical-json";

describe("canonical JSON stringify and hashing", () => {
  it("produces identical output for objects with different key insertion orders", () => {
    const objA = { b: 2, a: 1, c: { y: 20, x: 10 } };
    const objB = { c: { x: 10, y: 20 }, a: 1, b: 2 };

    const strA = canonicalJsonStringify(objA);
    const strB = canonicalJsonStringify(objB);

    expect(strA).toBe(strB);
    expect(strA).toBe('{"a":1,"b":2,"c":{"x":10,"y":20}}');

    const hashA = computeCanonicalHash(objA);
    const hashB = computeCanonicalHash(objB);

    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves array element order while canonicalizing object elements inside arrays", () => {
    const arrA = [
      { z: 9, a: 1 },
      { y: 8, b: 2 },
    ];
    const arrB = [
      { a: 1, z: 9 },
      { b: 2, y: 8 },
    ];

    expect(canonicalJsonStringify(arrA)).toBe(canonicalJsonStringify(arrB));
    expect(canonicalJsonStringify(arrA)).toBe('[{"a":1,"z":9},{"b":2,"y":8}]');

    // Array reordering produces different output
    const arrReversed = [
      { b: 2, y: 8 },
      { a: 1, z: 9 },
    ];
    expect(canonicalJsonStringify(arrA)).not.toBe(canonicalJsonStringify(arrReversed));
    expect(computeCanonicalHash(arrA)).not.toBe(computeCanonicalHash(arrReversed));
  });

  it("handles primitives, null, and dates deterministically", () => {
    const date = new Date("2026-08-30T12:00:00.000Z");
    const data = {
      date,
      count: 42,
      label: "test",
      flag: true,
      empty: null,
    };

    const str = canonicalJsonStringify(data);
    expect(str).toBe('{"count":42,"date":"2026-08-30T12:00:00.000Z","empty":null,"flag":true,"label":"test"}');
  });

  it("produces distinct hashes for different values", () => {
    const hash1 = computeCanonicalHash({ income: "100000.00", expenses: "50000.00" });
    const hash2 = computeCanonicalHash({ income: "100000.00", expenses: "50000.01" });
    expect(hash1).not.toBe(hash2);
  });
});
