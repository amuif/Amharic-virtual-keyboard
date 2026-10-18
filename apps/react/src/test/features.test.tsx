import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { AmharicKeyboard } from "../AmharicKeyboard";
import { runAmharicKeyboardTool, amharicKeyboardTools } from "../agent";
import type { AmharicKeyboardRef } from "../types";

const key = (container: HTMLElement, value: string) =>
  container.querySelector<HTMLButtonElement>(`.keyboard-key[data-key-value="${value}"]`)!;

const familyKey = (container: HTMLElement, value: string) =>
  container.querySelector<HTMLButtonElement>(`.keyboard-child-button[data-key-value="${value}"]`)!;

describe("AmharicKeyboard features", () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    input = document.createElement("input");
    document.body.appendChild(input);
  });

  afterEach(() => {
    input.remove();
  });

  describe("Editing at the caret", () => {
    it("inserts at the caret instead of appending", () => {
      input.value = "ሀመ";
      input.setSelectionRange(1, 1);
      const { container } = render(<AmharicKeyboard targetInput={input} />);

      fireEvent.click(key(container, "ለ"));
      expect(input.value).toBe("ሀለመ");
      expect(input.selectionStart).toBe(2);
    });

    it("backspace deletes the character before the caret", () => {
      input.value = "ሀለመ";
      input.setSelectionRange(2, 2);
      const { container } = render(<AmharicKeyboard targetInput={input} />);

      fireEvent.click(key(container, "backspace"));
      expect(input.value).toBe("ሀመ");
    });

    it("shows every member of large families", () => {
      const { container } = render(<AmharicKeyboard targetInput={input} />);
      fireEvent.click(key(container, "ቀ"));

      const family = container.querySelectorAll(".keyboard-child-button:not(.is-empty)");
      expect(family).toHaveLength(12);
      expect(familyKey(container, "ቍ")).toBeInTheDocument();
    });
  });

  describe("Controlled mode", () => {
    it("reports edits through onChange without a DOM input", () => {
      const onChange = vi.fn();
      const { container, rerender } = render(<AmharicKeyboard value="ሀ" onChange={onChange} />);

      fireEvent.click(key(container, "ለ"));
      expect(onChange).toHaveBeenLastCalledWith("ሀለ");

      rerender(<AmharicKeyboard value="ሀለ" onChange={onChange} />);
      fireEvent.click(key(container, "backspace"));
      expect(onChange).toHaveBeenLastCalledWith("ሀ");
    });

    it("works with React state", () => {
      const Controlled = () => {
        const [value, setValue] = useState("");
        return (
          <>
            <output data-testid="out">{value}</output>
            <AmharicKeyboard value={value} onChange={setValue} mode="inline" />
          </>
        );
      };
      const { container, getByTestId } = render(<Controlled />);

      fireEvent.click(key(container, "ሰ"));
      fireEvent.click(familyKey(container, "ሳ"));
      fireEvent.click(key(container, "space"));
      expect(getByTestId("out").textContent).toBe("ሳ ");
    });

    it("keeps an uncontrolled buffer when no input is attached", () => {
      const ref = React.createRef<AmharicKeyboardRef>();
      const onChange = vi.fn();
      const { container } = render(
        <AmharicKeyboard ref={ref} defaultValue="ሀ" onChange={onChange} />,
      );
      // Make sure no previously focused input is picked up
      input.remove();

      fireEvent.click(key(container, "ለ"));
      expect(onChange).toHaveBeenLastCalledWith("ሀለ");
      expect(ref.current!.getValue()).toBe("ሀለ");
    });
  });

  describe("Modes and theming", () => {
    it("renders inline without drag or resize handles", () => {
      const { container } = render(<AmharicKeyboard targetInput={input} mode="inline" />);
      const root = container.querySelector(".amharic-virtual-keyboard")!;

      expect(root).toHaveClass("avk-inline");
      expect(root).not.toHaveStyle({ position: "fixed" });
      expect(container.querySelector(".resize-handle")).not.toBeInTheDocument();
    });

    it("sets the theme attribute", () => {
      const { container } = render(<AmharicKeyboard targetInput={input} theme="dark" />);
      expect(container.querySelector(".amharic-virtual-keyboard")).toHaveAttribute(
        "data-theme",
        "dark",
      );
    });

    it("applies per-part class names", () => {
      const { container } = render(
        <AmharicKeyboard targetInput={input} classNames={{ key: "my-key", row: "my-row" }} />,
      );
      expect(container.querySelectorAll(".keyboard-key.my-key").length).toBeGreaterThan(0);
      expect(container.querySelectorAll(".keyboard-row.my-row").length).toBeGreaterThan(0);
    });
  });

  describe("Callbacks", () => {
    it("lets onKeyPress cancel a key", () => {
      const onKeyPress = vi.fn((k) => k.value !== "ለ");
      const { container } = render(
        <AmharicKeyboard targetInput={input} onKeyPress={onKeyPress} />,
      );

      fireEvent.click(key(container, "ለ"));
      fireEvent.click(key(container, "ሀ"));
      expect(input.value).toBe("ሀ");
      expect(onKeyPress).toHaveBeenCalledTimes(2);
    });

    it("calls onEnter for single-line inputs", () => {
      const onEnter = vi.fn();
      const { container } = render(<AmharicKeyboard targetInput={input} onEnter={onEnter} />);

      fireEvent.click(key(container, "enter"));
      expect(onEnter).toHaveBeenCalledWith(input);
      expect(input.value).toBe("");
    });

    it("inserts a newline in textareas", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      const { container } = render(<AmharicKeyboard targetInput={textarea} />);

      fireEvent.click(key(container, "enter"));
      expect(textarea.value).toBe("\n");
      textarea.remove();
    });

    it("fires visibility and minimize callbacks", () => {
      const ref = React.createRef<AmharicKeyboardRef>();
      const onHide = vi.fn();
      const onShow = vi.fn();
      const onMinimizeChange = vi.fn();
      const onClose = vi.fn();
      const { getByLabelText } = render(
        <AmharicKeyboard
          ref={ref}
          targetInput={input}
          closeButton
          onHide={onHide}
          onShow={onShow}
          onMinimizeChange={onMinimizeChange}
          onClose={onClose}
        />,
      );

      fireEvent.click(getByLabelText("Minimize keyboard"));
      expect(onMinimizeChange).toHaveBeenLastCalledWith(true);
      fireEvent.click(getByLabelText("Restore Amharic keyboard"));
      expect(onMinimizeChange).toHaveBeenLastCalledWith(false);

      fireEvent.click(getByLabelText("Close keyboard"));
      expect(onClose).toHaveBeenCalled();
      expect(onHide).toHaveBeenCalled();

      act(() => ref.current!.show());
      expect(onShow).toHaveBeenCalled();
    });
  });

  describe("Custom rendering", () => {
    it("uses renderKey and keeps press behaviour", () => {
      const { getByTestId } = render(
        <AmharicKeyboard
          targetInput={input}
          renderKey={(k, { press, renderDefault }) =>
            k.value === "ለ" ? (
              <button data-testid="custom-le" onClick={press}>
                L
              </button>
            ) : (
              renderDefault()
            )
          }
        />,
      );

      fireEvent.click(getByTestId("custom-le"));
      expect(input.value).toBe("ለ");
    });

    it("uses renderHeader", () => {
      const { getByText, queryByLabelText } = render(
        <AmharicKeyboard
          targetInput={input}
          renderHeader={({ minimize }) => <button onClick={minimize}>my header</button>}
        />,
      );

      expect(getByText("my header")).toBeInTheDocument();
      expect(queryByLabelText("Minimize keyboard")).not.toBeInTheDocument();
    });

    it("uses renderFamilyKey", () => {
      const { container, getAllByTestId } = render(
        <AmharicKeyboard
          targetInput={input}
          renderFamilyKey={(char, { press, isBase }) => (
            <button data-testid={isBase ? "base" : "fam"} onClick={press}>
              {char}
            </button>
          )}
        />,
      );

      fireEvent.click(key(container, "ሀ"));
      fireEvent.click(getAllByTestId("fam")[0]!);
      expect(input.value).toBe("ሁ");
    });
  });

  describe("Agent API", () => {
    it("types, presses keys and reports state through the ref", () => {
      const ref = React.createRef<AmharicKeyboardRef>();
      render(<AmharicKeyboard ref={ref} targetInput={input} />);

      act(() => {
        expect(ref.current!.typeText("ሰላም")).toBe(true);
        expect(ref.current!.pressKey("space")).toBe(true);
        expect(ref.current!.pressKey("ሀ")).toBe(true);
        expect(ref.current!.pressKey("ሁ")).toBe(true);
        expect(ref.current!.pressKey("not-a-key")).toBe(false);
        expect(ref.current!.backspace()).toBe(true);
      });

      expect(input.value).toBe("ሰላም ሀ");
      const state = ref.current!.getState();
      expect(state.value).toBe("ሰላም ሀ");
      expect(state.hasTarget).toBe(true);
      expect(ref.current!.getLayout().flat().some((k) => k.value === "ሀ")).toBe(true);

      act(() => {
        ref.current!.clear();
      });
      expect(input.value).toBe("");
    });

    it("runs tool calls", () => {
      const ref = React.createRef<AmharicKeyboardRef>();
      render(<AmharicKeyboard ref={ref} targetInput={input} />);

      let result = runAmharicKeyboardTool(ref.current, "amharic_keyboard_type", { text: "ሰላም" });
      expect(result.ok).toBe(true);
      expect(input.value).toBe("ሰላም");

      result = runAmharicKeyboardTool(ref.current, "amharic_keyboard_backspace", { count: 2 });
      expect(input.value).toBe("ሰ");

      result = runAmharicKeyboardTool(ref.current, "amharic_keyboard_press_key", { key: "??" });
      expect(result.ok).toBe(false);

      result = runAmharicKeyboardTool(ref.current, "nope");
      expect(result).toEqual({ ok: false, error: 'Unknown tool "nope".' });

      expect(runAmharicKeyboardTool(null, "amharic_keyboard_clear").ok).toBe(false);
    });

    it("has a schema for every tool the dispatcher handles", () => {
      const ref = React.createRef<AmharicKeyboardRef>();
      render(<AmharicKeyboard ref={ref} targetInput={input} />);

      for (const tool of amharicKeyboardTools) {
        expect(tool.input_schema.type).toBe("object");
        const result = runAmharicKeyboardTool(ref.current, tool.name, {
          text: "ሀ",
          key: "ሀ",
          visibility: "show",
        });
        expect(result.error ?? "").not.toMatch(/Unknown tool/);
      }
    });

    it("exposes a bridge on window when exposeAs is set", () => {
      const { unmount } = render(<AmharicKeyboard targetInput={input} exposeAs="avkTest" />);
      const bridge = (window as any).avkTest;

      expect(bridge.tools).toBe(amharicKeyboardTools);
      act(() => {
        bridge.run("amharic_keyboard_type", { text: "ሀ" });
      });
      expect(input.value).toBe("ሀ");

      unmount();
      expect((window as any).avkTest).toBeUndefined();
    });

    it("marks keys with data attributes and aria labels", () => {
      const { container, getByLabelText } = render(<AmharicKeyboard targetInput={input} />);

      expect(container.querySelector('[data-amharic-keyboard="open"]')).toBeInTheDocument();
      expect(key(container, "ሀ")).toHaveAttribute("data-key-type", "char");
      expect(getByLabelText("Backspace")).toHaveAttribute("data-key-type", "backspace");
      expect(getByLabelText("Space")).toBeInTheDocument();
    });
  });
});
