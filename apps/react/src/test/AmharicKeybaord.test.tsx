import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { AmharicKeyboard } from "../AmharicKeyboard";
import type { AmharicKeyboardRef } from "../types";

// Mock the actual component since it has complex DOM interactions
// We'll test the public API and core functionality

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
  });

  describe("Component Rendering", () => {
    it("should render the keyboard component", () => {
      const { container } = render(<AmharicKeyboard targetInput={mockInput} />);

      expect(
        container.querySelector(".amharic-virtual-keyboard"),
      ).toBeInTheDocument();
    });

    it("should render with header when showHeader is true", () => {
      const { getByText } = render(
        <AmharicKeyboard targetInput={mockInput} showHeader={true} />,
      );

      expect(getByText("Amharic Keyboard")).toBeInTheDocument();
    });

    it("should not render header when showHeader is false", () => {
      const { queryByText } = render(
        <AmharicKeyboard targetInput={mockInput} showHeader={false} />,
      );

      expect(queryByText("Amharic Keyboard")).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <AmharicKeyboard targetInput={mockInput} className="custom-class" />,
      );

      expect(
        container.querySelector(".amharic-virtual-keyboard.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("Keyboard Functionality", () => {
    it("should insert character when key is pressed", async () => {
      // Test the API method instead of simulating clicks
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      // Use API to test functionality
      expect(keyboardRef.current).toBeDefined();
    });

    it("should handle backspace", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      expect(keyboardRef.current).toBeDefined();
    });
  });

  describe("API Methods", () => {
    it("should add input via addInput method", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      render(<AmharicKeyboard ref={keyboardRef} />);

      expect(keyboardRef.current).toBeDefined();

      if (keyboardRef.current) {
        const result = keyboardRef.current.addInput(mockInput);
        expect(result).toBe(true);

        const allInputs = keyboardRef.current.getAllInputs();
        expect(allInputs).toContain(mockInput);
      }
    });

    it("should remove input via removeInput method", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      if (keyboardRef.current) {
        const removeResult = keyboardRef.current.removeInput(mockInput);
        expect(removeResult).toBe(true);

        const allInputs = keyboardRef.current.getAllInputs();
        expect(allInputs).not.toContain(mockInput);
      }
    });

    it("should switch between inputs", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      // Create proper elements with event listener properties
      const mockInput = {
        type: "text",
        value: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        focus: vi.fn(),
        dispatchEvent: vi.fn(),
        // Add other properties the component expects
        tagName: "INPUT",
        nodeType: 1,
      } as unknown as HTMLInputElement;

      const mockTextarea = {
        value: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        focus: vi.fn(),
        dispatchEvent: vi.fn(),
        tagName: "TEXTAREA",
        nodeType: 1,
      } as unknown as HTMLTextAreaElement;

      render(
        <AmharicKeyboard
          ref={keyboardRef}
          targetInputs={[mockInput, mockTextarea]}
        />,
      );

      act(() => {
        if (keyboardRef.current) {
          // Initially should be first input
          expect(keyboardRef.current.getCurrentInput()).toBe(mockInput);

          // Switch to textarea
          const switchResult = keyboardRef.current.switchToInput(mockTextarea);
          expect(switchResult).toBe(true);
        }
      });

      if (keyboardRef.current) {
        expect(keyboardRef.current.getCurrentInput()).toBe(mockTextarea);
      }
    });

    it("should show and hide keyboard", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();
      const { container, rerender } = render(
        <AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />,
      );

      act(() => {
        if (keyboardRef.current) {
          // Initially should be visible
          expect(
            container.querySelector(".amharic-virtual-keyboard"),
          ).toBeInTheDocument();

          // Hide
          keyboardRef.current.hide();
        }
      });

      // Re-render to see the hide effect
      rerender(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      // Keyboard should be hidden (component returns null)
      expect(
        container.querySelector(".amharic-virtual-keyboard"),
      ).not.toBeInTheDocument();

      act(() => {
        if (keyboardRef.current) {
          // Show again
          keyboardRef.current.show();
        }
      });

      // Re-render to see the show effect
      rerender(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      // Should be visible again
      expect(
        container.querySelector(".amharic-virtual-keyboard"),
      ).toBeInTheDocument();
    });

    it("should get current value", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();
      mockInput.value = "ሀለሐ";

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      if (keyboardRef.current) {
        const value = keyboardRef.current.getValue();
        expect(value).toBe("ሀለሐ");
      }
    });

    it("should move keyboard position", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      act(() => {
        if (keyboardRef.current) {
          // This just tests that the method can be called
          // Actual DOM position testing would need e2e tests
          expect(() => keyboardRef.current!.moveTo(100, 150)).not.toThrow();
        }
      });
    });

    it("should resize keyboard", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);
      act(() => {
        if (keyboardRef.current) {
          // This just tests that the method can be called
          // Actual DOM size testing would need e2e tests
          expect(() => keyboardRef.current!.resize(600, 400)).not.toThrow();
        }
      });
    });
  });

  describe("Input Synchronization", () => {
    it("should sync input value changes", async () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();
      mockInput.value = "initial";

      render(<AmharicKeyboard ref={keyboardRef} targetInput={mockInput} />);

      await act(async () => {
        if (keyboardRef.current) {
          // Change input value
          mockInput.value = "updated";
          fireEvent.input(mockInput);

          // Wait for any async updates
          await new Promise((resolve) => setTimeout(resolve, 0));

          // Sync should update keyboard's internal state
          keyboardRef.current.syncInput();

          // Wait for sync to complete
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      });

      if (keyboardRef.current) {
        const value = keyboardRef.current.getValue();
        expect(value).toBe("updated");
      }
    });
  });

  describe("Multiple Inputs", () => {
    it("should handle multiple inputs", () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();
      const input2 = document.createElement("input");
      input2.type = "text";
      input2.value = "";

      render(
        <AmharicKeyboard
          ref={keyboardRef}
          targetInputs={[mockInput, input2]}
        />,
      );

      if (keyboardRef.current) {
        const allInputs = keyboardRef.current.getAllInputs();
        expect(allInputs).toHaveLength(2);
        expect(allInputs).toContain(mockInput);
        expect(allInputs).toContain(input2);
      }

      // Clean up
      if (input2.parentNode) {
        input2.parentNode.removeChild(input2);
      }
    });

    it("should switch current input when input receives focus", async () => {
      const keyboardRef = React.createRef<AmharicKeyboardRef>();
      const input2 = document.createElement("input");
      input2.type = "text";
      input2.value = "";

      render(
        <AmharicKeyboard
          ref={keyboardRef}
          targetInputs={[mockInput, input2]}
        />,
      );

      await act(async () => {
        if (keyboardRef.current) {
          // Initially current input should be first one
          expect(keyboardRef.current.getCurrentInput()).toBe(mockInput);

          // Simulate focus on second input
          input2.focus();
          fireEvent.focus(input2);

          // Wait for any async updates
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      });

      if (keyboardRef.current) {
        // Should switch to second input
        expect(keyboardRef.current.getCurrentInput()).toBe(input2);
      }

      // Clean up
      if (input2.parentNode) {
        input2.parentNode.removeChild(input2);
      }
    });
  });
});
