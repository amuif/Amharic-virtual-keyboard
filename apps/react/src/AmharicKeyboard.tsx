import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { AmharicKeyboardProps, AmharicKeyboardRef } from "./types";
import "./style.css";
import { amharicLayout } from "@amharic-keyboard/core";

interface ActiveFamily {
  value: string;
  children: string[];
}

type EditableElement = HTMLInputElement | HTMLTextAreaElement;

const TEXT_INPUT_TYPES = ["text", "search", "email", "url", "tel"];

const isTextEditable = (el: unknown): el is EditableElement =>
  el instanceof HTMLTextAreaElement ||
  (el instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(el.type));

// Tracked at module level so it survives the keyboard being unmounted and
// remounted (e.g. conditionally rendered), which drops its registered inputs.
let lastFocusedInput: EditableElement | null = null;

if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (e) => {
      const target = e.target;
      if (
        isTextEditable(target) &&
        !target.closest(".amharic-virtual-keyboard")
      ) {
        lastFocusedInput = target;
      }
    },
    true,
  );
}

export const AmharicKeyboard = forwardRef<
  AmharicKeyboardRef,
  AmharicKeyboardProps
>(
  (
    {
      targetInput,
      targetInputs,
      layout = amharicLayout,
      draggable = true,
      showHeader = true,
      minimizeButton = true,
      closeButton = false,
      minWidth = 350,
      minHeight = 300,
      maxWidth = 800,
      maxHeight = 400,
      onClose,
      className = "",
      style = {},
      children,
    },
    ref,
  ) => {
    const [value, setValue] = useState<string>("");
    const [activeFamily, setActiveFamily] = useState<ActiveFamily | null>(null);
    const [currentChildren, setCurrentChildren] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [size, setSize] = useState({ width: minWidth, height: minHeight });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({
      x: 0,
      y: 0,
      width: minWidth,
      height: minHeight,
    });

    const keyboardRef = useRef<HTMLDivElement>(null);
    const currentInputRef = useRef<
      HTMLInputElement | HTMLTextAreaElement | null
    >(null);
    const inputsRef = useRef<(HTMLInputElement | HTMLTextAreaElement)[]>([]);
    // Listener cleanup per registered input
    const listenerCleanupsRef = useRef(new Map<EditableElement, () => void>());

    // Setup input listeners
    const setupInputListeners = useCallback(
      (input: HTMLInputElement | HTMLTextAreaElement) => {
        const focusHandler = () => {
          if (
            currentInputRef.current !== input &&
            inputsRef.current.includes(input)
          ) {
            currentInputRef.current = input;
            setValue(input.value);
            setActiveFamily(null);
            setCurrentChildren([]);

            if (keyboardRef.current) {
              keyboardRef.current.style.opacity = "1";
            }
          }
        };

        const inputHandler = () => {
          if (currentInputRef.current === input) {
            setValue(input.value);
          }
        };

        const changeHandler = () => {
          if (currentInputRef.current === input) {
            setValue(input.value);
          }
        };

        input.addEventListener("focus", focusHandler);
        input.addEventListener("input", inputHandler);
        input.addEventListener("change", changeHandler);

        return () => {
          input.removeEventListener("focus", focusHandler);
          input.removeEventListener("input", inputHandler);
          input.removeEventListener("change", changeHandler);
        };
      },
      [],
    );

    const registerInput = useCallback(
      (input: EditableElement) => {
        if (listenerCleanupsRef.current.has(input)) return false;
        inputsRef.current.push(input);
        listenerCleanupsRef.current.set(input, setupInputListeners(input));
        return true;
      },
      [setupInputListeners],
    );

    const unregisterInput = useCallback((input: EditableElement) => {
      const cleanup = listenerCleanupsRef.current.get(input);
      if (!cleanup) return false;
      cleanup();
      listenerCleanupsRef.current.delete(input);
      inputsRef.current = inputsRef.current.filter((i) => i !== input);

      if (currentInputRef.current === input) {
        currentInputRef.current = inputsRef.current[0] || null;
        setValue(currentInputRef.current?.value || "");
      }
      return true;
    }, []);

    // Initialize inputs from props. Only the inputs registered here are
    // unregistered on cleanup, so inputs added via ref.addInput are kept.
    useEffect(() => {
      const propInputs = (
        targetInputs && targetInputs.length > 0
          ? targetInputs
          : targetInput
            ? [targetInput]
            : []
      ).filter(
        (input): input is EditableElement =>
          input != null &&
          typeof input === "object" &&
          "addEventListener" in input,
      );

      const added = propInputs.filter(registerInput);

      const firstInput = propInputs[0];
      if (firstInput) {
        currentInputRef.current = firstInput;
        setValue(firstInput.value || "");
      }

      // Global click listener for opacity
      const handleDocumentClick = (e: MouseEvent) => {
        if (
          keyboardRef.current &&
          !keyboardRef.current.contains(e.target as Node)
        ) {
          keyboardRef.current.style.opacity = "1";
        }
      };

      document.addEventListener("click", handleDocumentClick);

      return () => {
        document.removeEventListener("click", handleDocumentClick);
        added.forEach(unregisterInput);
      };
    }, [targetInput, targetInputs, registerInput, unregisterInput]);

    // Remove listeners from every input (including ref-added ones) on unmount
    useEffect(() => {
      const cleanups = listenerCleanupsRef.current;
      return () => {
        cleanups.forEach((cleanup) => cleanup());
        cleanups.clear();
        inputsRef.current = [];
        currentInputRef.current = null;
      };
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
        if (!registerInput(input)) return false;
        if (!currentInputRef.current) {
          currentInputRef.current = input;
          setValue(input.value || "");
        }
        return true;
      },

      removeInput: (input: HTMLInputElement | HTMLTextAreaElement) =>
        unregisterInput(input),

      switchToInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
        if (
          currentInputRef.current !== input &&
          inputsRef.current.includes(input)
        ) {
          currentInputRef.current = input;
          setValue(input.value);
          setActiveFamily(null);
          setCurrentChildren([]);

          if (keyboardRef.current) {
            keyboardRef.current.style.opacity = "1";
          }
          return true;
        }
        return false;
      },

      getCurrentInput: () => currentInputRef.current,

      getAllInputs: () => [...inputsRef.current],

      show: () => {
        setIsVisible(true);
        setIsMinimized(false);
      },

      hide: () => {
        setIsVisible(false);
      },

      toggleMinimize: () => {
        setIsMinimized(!isMinimized);
      },

      moveTo: (x: number, y: number) => {
        setPosition({ x, y });
      },

      resize: (width: number, height: number) => {
        const newWidth = Math.max(minWidth, Math.min(width, maxWidth));
        const newHeight = Math.max(minHeight, Math.min(height, maxHeight));
        setSize({ width: newWidth, height: newHeight });
      },

      syncInput: () => {
        if (currentInputRef.current) {
          setValue(currentInputRef.current.value);
        }
      },

      getValue: () => value,
    }));

    // Drag functionality
    const handleDragStart = useCallback(
      (e: React.MouseEvent) => {
        if (!draggable || !keyboardRef.current) return;

        const target = e.target as HTMLElement;
        if (
          target.tagName === "BUTTON" ||
          target.classList.contains("resize-handle")
        ) {
          return;
        }

        setIsDragging(true);
        const rect = keyboardRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      },
      [draggable],
    );

    useEffect(() => {
      const handleDragMove = (e: MouseEvent) => {
        if (!isDragging || !keyboardRef.current) return;

        e.preventDefault();

        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;

        const keyboardWidth = keyboardRef.current.offsetWidth;
        const keyboardHeight = keyboardRef.current.offsetHeight;
        const maxX = window.innerWidth - keyboardWidth;
        const maxY = window.innerHeight - keyboardHeight;

        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));

        setPosition({ x: boundedX, y: boundedY });
      };

      const handleDragEnd = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);
      }

      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
      };
    }, [isDragging, dragOffset]);

    // Resize functionality
    const handleResizeStart = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: size.width,
          height: size.height,
        });
      },
      [size],
    );

    useEffect(() => {
      const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing) return;

        e.preventDefault();

        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width + deltaX;
        let newHeight = resizeStart.height + deltaY;

        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

        const maxViewportWidth = window.innerWidth * 0.9;
        const maxViewportHeight = window.innerHeight * 0.9;
        newWidth = Math.min(newWidth, maxViewportWidth);
        newHeight = Math.min(newHeight, maxViewportHeight);

        setSize({ width: newWidth, height: newHeight });

        if (keyboardRef.current) {
          const rect = keyboardRef.current.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            const newLeft = window.innerWidth - newWidth;
            setPosition((pos) => ({ ...pos, x: Math.max(0, newLeft) }));
          }

          if (rect.bottom > window.innerHeight) {
            const newTop = window.innerHeight - newHeight;
            setPosition((pos) => ({ ...pos, y: Math.max(0, newTop) }));
          }
        }
      };

      const handleResizeEnd = () => {
        setIsResizing(false);
      };

      if (isResizing) {
        document.addEventListener("mousemove", handleResizeMove);
        document.addEventListener("mouseup", handleResizeEnd);
      }

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }, [isResizing, resizeStart, minWidth, minHeight, maxWidth, maxHeight]);

    // Keyboard input handling

    // The registered input, or the last focused text input on the page when
    // none is registered (or the registered one was removed from the DOM).
    const resolveTargetInput = useCallback((): EditableElement | null => {
      const current = currentInputRef.current;
      if (current && current.isConnected !== false) return current;

      if (lastFocusedInput && lastFocusedInput.isConnected) {
        currentInputRef.current = lastFocusedInput;
        return lastFocusedInput;
      }
      return null;
    }, []);

    const syncInput = useCallback((newValue: string) => {
      if (currentInputRef.current) {
        currentInputRef.current.value = newValue;
        currentInputRef.current.focus();
        currentInputRef.current.dispatchEvent(
          new Event("input", { bubbles: true }),
        );
        setValue(currentInputRef.current.value);
      }
    }, []);

    const insertCharacter = useCallback(
      (char: string) => {
        const target = resolveTargetInput();
        if (!target) return;
        syncInput(target.value + char);
      },
      [resolveTargetInput, syncInput],
    );

    const handleKeyPress = useCallback(
      (key: any) => {
        const target = resolveTargetInput();
        if (!target) return;

        if (key.type === "char" && key.children?.length) {
          const family = { value: key.value, children: key.children };
          setActiveFamily(family);
          insertCharacter(key.value);
          setCurrentChildren([key.value, ...key.children]);
          return;
        }

        setActiveFamily(null);
        setCurrentChildren([]);

        if (key.type === "char" || key.type === "point") {
          insertCharacter(key.value || "");
        } else if (key.type === "space") {
          insertCharacter(" ");
        } else if (key.type === "enter") {
          insertCharacter("\n");
        } else if (key.type === "backspace") {
          syncInput(target.value.slice(0, -1));
        }
      },
      [resolveTargetInput, insertCharacter, syncInput],
    );

    const handleChildButtonClick = useCallback(
      (char: string) => {
        const target = resolveTargetInput();
        if (!char || !activeFamily || !target) return;

        const isSameFamily = [
          activeFamily.value,
          ...activeFamily.children,
        ].includes(char);

        if (isSameFamily && target.value.endsWith(activeFamily.value)) {
          syncInput(target.value.slice(0, -1) + char);
        } else {
          insertCharacter(char);
        }
      },
      [activeFamily, resolveTargetInput, insertCharacter, syncInput],
    );

    if (!isVisible) return null;

    if (isMinimized) {
      return (
        <div
          className="amharic-virtual-keyboard-minimized"
          onClick={() => setIsMinimized(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
          }}
          title="Click to restore Amharic Keyboard"
          aria-label="Restore Amharic Keyboard"
        >
         ⌨️
        </div>
      );
    }

    const keyboardStyle: React.CSSProperties = {
      position: "fixed",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0px 3px",
      background: "#ECECEC",
      border: "1px solid #ccc",
      borderRadius: "5px",
      zIndex: 10000,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      userSelect: "none",
      transition: isDragging || isResizing ? "none" : "all 0.3s ease",
      cursor: isDragging ? "grabbing" : "default",
      overflow: "hidden",
      ...style,
    };

    return (
      <div
        ref={keyboardRef}
        className={`amharic-virtual-keyboard ${className}`}
        style={keyboardStyle}
      >
        {showHeader && (
          <div
            className="keyboard-header"
            style={{
              cursor: draggable ? "move" : "default",
            }}
            onMouseDown={handleDragStart}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "end",
                width: "100%",
                gap: "8px",
                padding: "4px",
              }}
            >
              {minimizeButton && (
                <button
                  onClick={() => setIsMinimized(true)}
                  style={{
                    display: "flex",
                    alignItems: "end",
                    justifyContent: "end",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    width: "24px",
                    height: "24px",
                    borderRadius: "3px",
                    fontSize: "18px",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M2 12C2 11.4477 2.44772 11 3 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H3C2.44772 13 2 12.5523 2 12Z"
                        fill="#000"
                      ></path>{" "}
                    </g>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Child buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "10px",
            width: "100%",
            flexWrap: "wrap",
            gap: "2px",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const char = currentChildren[i];
            return (
              <button
                key={i}
                className="keyboard-child-button"
                style={{
                  margin: "2px",
                  padding: "10px",
                  minWidth: "40px",
                  minHeight: "40px",
                  fontSize: "18px",
                  cursor: "pointer",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                }}
                onClick={() => char && handleChildButtonClick(char)}
                disabled={!char}
              >
                {char || ""}
              </button>
            );
          })}
        </div>

        {/* Keyboard rows */}
        {layout.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "5px",
              width: "100%",
            }}
          >
            {row.map((key, keyIndex) => (
              <button
                key={keyIndex}
                className="keyboard-key"
                style={{
                  margin: "2px",
                  padding: "8px",
                  minWidth: "35px",
                  minHeight: "40px",
                  fontSize: "16px",
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  background: "#fff",
                  flex: 1,
                }}
                onClick={() => handleKeyPress(key)}
              >
                {key.label}
              </button>
            ))}
          </div>
        ))}

        {children}

        {/* Resize handle */}
        <div
          className="resize-handle"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "20px",
            height: "20px",
            cursor: "se-resize",
            background: "linear-gradient(135deg, transparent 50%, #888 50%)",
          }}
          onMouseDown={handleResizeStart}
        />
      </div>
    );
  },
);

AmharicKeyboard.displayName = "AmharicKeyboard";
