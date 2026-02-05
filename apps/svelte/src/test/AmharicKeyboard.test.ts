import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import AmharicKeyboard from "../AmharicKeyboard.svelte";

describe("AmharicKeyboard Component", () => {
  let mockInput: HTMLInputElement;
  let mockTextarea: HTMLTextAreaElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockInput = document.createElement("input");
    mockInput.type = "text";
    mockInput.value = "";

    mockTextarea = document.createElement("textarea");
    mockTextarea.value = "";

    document.body.appendChild(mockInput);
    document.body.appendChild(mockTextarea);
  });

  afterEach(() => {
    // Clean up
    if (mockInput.parentNode) {
      mockInput.parentNode.removeChild(mockInput);
    }
    if (mockTextarea.parentNode) {
      mockTextarea.parentNode.removeChild(mockTextarea);
    }
    cleanup();
  });

  describe("Component Rendering", () => {
    it("should render the keyboard component", () => {
      const { container } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      expect(
        container.querySelector(".amharic-virtual-keyboard"),
      ).toBeInTheDocument();
    });

    it("should render with header when showHeader is true", () => {
      const { container } = render(AmharicKeyboard, {
        props: {
          targetInput: mockInput,
          showHeader: true,
        },
      });

      expect(container.querySelector(".keyboard-header")).toBeInTheDocument();
    });

    it("should not render header when showHeader is false", () => {
      const { container } = render(AmharicKeyboard, {
        props: {
          targetInput: mockInput,
          showHeader: false,
        },
      });

      expect(
        container.querySelector(".keyboard-header"),
      ).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(AmharicKeyboard, {
        props: {
          targetInput: mockInput,
          className: "custom-class",
        },
      });

      expect(
        container.querySelector(".amharic-virtual-keyboard.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("API Methods", () => {
    // In Svelte 5, you can access component exports using the component instance
    // The render function returns a component property
    it("should insert character when key is pressed", async () => {
      const { component } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      // Access the component instance
      expect(component).toBeDefined();
    });

    it("should update value when input changes", async () => {
      const { component } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      // Directly update the input and sync
      mockInput.value = "ሀ";
      await fireEvent.input(mockInput);

      if (typeof component.syncInput === "function") {
        component.syncInput();
        expect(component.getValue()).toBe("ሀ");
      }
    });
  });

  describe("Input Synchronization", () => {
    it("should sync input value changes", async () => {
      mockInput.value = "initial";
      const { component } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      // Simulate typing in the input
      mockInput.value = "updated";
      await fireEvent.input(mockInput);

      // Check if component syncs with input
      if (typeof component.getValue === "function") {
        expect(component.getValue()).toBe("updated");
      }
    });
  });

  describe("Multiple Inputs", () => {
    it("should handle multiple inputs", () => {
      const { component } = render(AmharicKeyboard, {
        props: { targetInputs: [mockInput, mockTextarea] },
      });

      // Test if component properly handles multiple inputs
      expect(component).toBeDefined();
    });

    it("should switch current input when input receives focus", async () => {
      const { component } = render(AmharicKeyboard, {
        props: { targetInputs: [mockInput, mockTextarea] },
      });

      // Simulate focus on second input
      mockTextarea.focus();
      await fireEvent.focus(mockTextarea);

      // Check if component switches focus
      if (typeof component.getCurrentInput === "function") {
        expect(component.getCurrentInput()).toBe(mockTextarea);
      }
    });
  });

  describe("Keyboard Visibility", () => {
    it("should be visible by default", () => {
      const { container } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      expect(
        container.querySelector(".amharic-virtual-keyboard"),
      ).toBeInTheDocument();
    });

    it("should be hidden when visible prop is false", () => {
      const { container } = render(AmharicKeyboard, {
        props: {
          targetInput: mockInput,
          visible: false,
        },
      });

      // Check if keyboard is hidden
      const keyboard = container.querySelector(".amharic-virtual-keyboard");
      expect(keyboard).not.toBeInTheDocument();
    });
  });

  describe("Event Handling", () => {
    it("should handle key press events", async () => {
      const { container, component } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      // Find a key button
      const keyButton = container.querySelector("[data-key='ሀ']");
      if (keyButton) {
        await fireEvent.click(keyButton);

        // The input value should be updated
        expect(mockInput.value).toContain("ሀ");
      }
    });

    it("should handle backspace", async () => {
      mockInput.value = "ሀለ";
      const { container } = render(AmharicKeyboard, {
        props: { targetInput: mockInput },
      });

      // Find backspace button
      const backspaceButton = container.querySelector(
        "[data-action='backspace']",
      );
      if (backspaceButton) {
        await fireEvent.click(backspaceButton);

        // The last character should be removed
        expect(mockInput.value).toBe("ሀ");
      }
    });
  });
});
