import { describe, it, expect } from "vitest";
import { insertText, deleteBackward, replaceBeforeCaret } from "../editing";

const at = (value: string, start: number, end = start) => ({
  value,
  selectionStart: start,
  selectionEnd: end,
});

describe("editing helpers", () => {
  it("inserts at the caret", () => {
    expect(insertText(at("ሀለ", 1), "መ")).toEqual({ value: "ሀመለ", caret: 2 });
  });

  it("replaces the selection when inserting", () => {
    expect(insertText(at("ሀለመ", 0, 2), "ሰ")).toEqual({ value: "ሰመ", caret: 1 });
  });

  it("deletes the character before the caret", () => {
    expect(deleteBackward(at("ሀለመ", 2))).toEqual({ value: "ሀመ", caret: 1 });
  });

  it("deletes the selection on backspace", () => {
    expect(deleteBackward(at("ሀለመ", 1, 3))).toEqual({ value: "ሀ", caret: 1 });
  });

  it("does nothing on backspace at the start", () => {
    expect(deleteBackward(at("ሀ", 0))).toEqual({ value: "ሀ", caret: 0 });
  });

  it("deletes a whole surrogate pair", () => {
    expect(deleteBackward(at("a😀", 3))).toEqual({ value: "a", caret: 1 });
  });

  it("replaces the base character before the caret", () => {
    expect(replaceBeforeCaret(at("ሀለ", 2), "ለ", "ሉ")).toEqual({ value: "ሀሉ", caret: 2 });
  });

  it("returns null when the text before the caret doesn't match", () => {
    expect(replaceBeforeCaret(at("ሀለ", 1), "ለ", "ሉ")).toBeNull();
  });

  it("clamps out-of-range selections", () => {
    expect(insertText(at("ab", 10), "c")).toEqual({ value: "abc", caret: 3 });
  });
});
