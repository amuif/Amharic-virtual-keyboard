import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  forwardRef,
} from "react";
import { amharicLayout } from "@amharic-keyboard/core";
import type { Key } from "@amharic-keyboard/core";
import type {
  AmharicKeyboardProps,
  AmharicKeyboardRef,
  EditableElement,
  KeyboardState,
} from "./types";
import {
  insertText,
  deleteBackward,
  replaceBeforeCaret,
  type EditState,
  type EditResult,
} from "./editing";
import { amharicKeyboardTools, runAmharicKeyboardTool } from "./agent";
import "./style.css";

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

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...names: (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(" ");

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

// Sets the value so React-controlled inputs see the change on the next
// "input" event (React ignores plain `el.value = ...` assignments).
const setNativeValue = (el: EditableElement, value: string) => {
  const Ctor =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(Ctor.prototype, "value")?.set;
  if (setter && el instanceof Ctor) setter.call(el, value);
  else el.value = value;
};

const readSelection = (el: EditableElement, fallback: number) => {
  try {
    const start = el.selectionStart ?? fallback;
    return [start, el.selectionEnd ?? start] as const;
  } catch {
    return [fallback, fallback] as const;
  }
};

const setCaret = (el: EditableElement, caret: number) => {
  try {
    el.setSelectionRange?.(caret, caret);
  } catch {
    // Some input types (e.g. email) don't support selection
  }
};

const useMediaQuery = (query: string) => {
  const get = () =>
    typeof window !== "undefined" && !!window.matchMedia?.(query).matches;
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return;
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, [query]);

  return matches;
};

const KEY_ARIA_LABELS: Partial<Record<Key["type"], string>> = {
  space: "Space",
  enter: "Enter",
  backspace: "Backspace",
  shift: "Shift",
};

type Interaction = {
  kind: "drag" | "resize";
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
};

export const AmharicKeyboard = forwardRef<
  AmharicKeyboardRef,
  AmharicKeyboardProps
>((props, ref) => {
  const {
    targetInput,
    targetInputs,
    layout = amharicLayout,
    value: valueProp,
    defaultValue = "",
    mode = "floating",
    theme = "light",
    title = "Amharic Keyboard",
    draggable = true,
    resizable = true,
    showHeader = true,
    minimizeButton = true,
    closeButton = false,
    defaultVisible = true,
    defaultMinimized = false,
    defaultPosition = { x: 20, y: 20 },
    minWidth = 350,
    minHeight = 300,
    maxWidth = 800,
    maxHeight = 400,
    compactBreakpoint = 640,
    renderKey,
    renderFamilyKey,
    renderHeader,
    exposeAs,
    className = "",
    classNames = {},
    style = {},
    children,
  } = props;

  // Latest props for stable callbacks
  const latest = useRef(props);
  latest.current = props;

  const isControlled = valueProp !== undefined;
  const isFloating = mode === "floating";

  const [activeFamily, setActiveFamily] = useState<Key | null>(null);
  const [visible, setVisible] = useState(defaultVisible);
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState({ width: minWidth, height: minHeight });
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const isCompact = useMediaQuery(`(max-width: ${compactBreakpoint}px)`);
  const isDocked = isFloating && isCompact;
  const canDrag = isFloating && !isDocked && draggable;
  const canResize = isFloating && !isDocked && resizable;

  const rootRef = useRef<HTMLDivElement>(null);
  const currentInputRef = useRef<EditableElement | null>(null);
  const inputsRef = useRef<EditableElement[]>([]);
  // Listener cleanup per registered input
  const listenerCleanupsRef = useRef(new Map<EditableElement, () => void>());
  const valueRef = useRef(isControlled ? valueProp : defaultValue);
  // Caret for edits that have no DOM input to hold a selection
  const caretRef = useRef<number | null>(null);
  const pendingCaretRef = useRef<{ target: EditableElement; caret: number } | null>(null);
  const lastPointerTypeRef = useRef<string>("mouse");

  // Setup input listeners
  const setupInputListeners = useCallback((input: EditableElement) => {
    const focusHandler = () => {
      if (
        currentInputRef.current !== input &&
        inputsRef.current.includes(input)
      ) {
        currentInputRef.current = input;
        if (latest.current.value === undefined) valueRef.current = input.value;
        setActiveFamily(null);
      }
    };

    const valueHandler = () => {
      if (currentInputRef.current === input && latest.current.value === undefined) {
        valueRef.current = input.value;
      }
    };

    input.addEventListener("focus", focusHandler);
    input.addEventListener("input", valueHandler);
    input.addEventListener("change", valueHandler);

    return () => {
      input.removeEventListener("focus", focusHandler);
      input.removeEventListener("input", valueHandler);
      input.removeEventListener("change", valueHandler);
    };
  }, []);

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
      if (latest.current.value === undefined) {
        valueRef.current = currentInputRef.current?.value || "";
      }
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
      if (latest.current.value === undefined) {
        valueRef.current = firstInput.value || "";
      }
    }

    return () => {
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

  // The registered input, or the last focused text input on the page when
  // none is registered (or the registered one was removed from the DOM).
  // Controlled keyboards only use inputs they were given explicitly.
  const resolveTargetInput = useCallback((): EditableElement | null => {
    const current = currentInputRef.current;
    if (current && current.isConnected !== false) return current;

    if (
      latest.current.value === undefined &&
      lastFocusedInput &&
      lastFocusedInput.isConnected
    ) {
      currentInputRef.current = lastFocusedInput;
      return lastFocusedInput;
    }
    return null;
  }, []);

  const refocus = useCallback((target: EditableElement) => {
    if (
      latest.current.refocusInput !== false &&
      lastPointerTypeRef.current !== "touch" &&
      typeof document !== "undefined" &&
      document.activeElement !== target
    ) {
      target.focus?.({ preventScroll: true });
    }
  }, []);

  // Keyboard input handling. Every edit goes through here so DOM inputs,
  // controlled values and the internal buffer behave the same.
  const applyEdit = useCallback(
    (compute: (state: EditState) => EditResult | null): boolean => {
      const controlledValue = latest.current.value;
      const controlled = controlledValue !== undefined;
      const target = resolveTargetInput();

      const value = controlled
        ? controlledValue
        : target
          ? target.value
          : valueRef.current;

      let state: EditState;
      if (target && target.value === value) {
        const [start, end] = readSelection(target, value.length);
        state = { value, selectionStart: start, selectionEnd: end };
      } else {
        const caret = Math.min(caretRef.current ?? value.length, value.length);
        state = { value, selectionStart: caret, selectionEnd: caret };
      }

      const result = compute(state);
      if (!result) return false;

      if (target && !controlled) {
        setNativeValue(target, result.value);
        setCaret(target, result.caret);
        target.dispatchEvent?.(new Event("input", { bubbles: true }));
        refocus(target);
      } else if (target && controlled) {
        // Applied once the parent re-renders the input with the new value
        pendingCaretRef.current = { target, caret: result.caret };
      }

      caretRef.current = result.caret;
      valueRef.current = result.value;
      latest.current.onChange?.(result.value);
      return true;
    },
    [resolveTargetInput, refocus],
  );

  useIsomorphicLayoutEffect(() => {
    if (valueProp === undefined) return;
    valueRef.current = valueProp;
    const pending = pendingCaretRef.current;
    if (pending && pending.target.value === valueProp) {
      setCaret(pending.target, pending.caret);
      refocus(pending.target);
      pendingCaretRef.current = null;
    }
  }, [valueProp, refocus]);

  const applyKey = useCallback(
    (key: Key): boolean => {
      if (latest.current.onKeyPress?.(key) === false) return false;

      switch (key.type) {
        case "char":
        case "point": {
          const ok = applyEdit((s) => insertText(s, key.value ?? key.label));
          setActiveFamily(key.type === "char" && key.children?.length ? key : null);
          return ok;
        }
        case "space":
          setActiveFamily(null);
          return applyEdit((s) => insertText(s, " "));
        case "enter": {
          setActiveFamily(null);
          const target = resolveTargetInput();
          if (target instanceof HTMLInputElement) {
            latest.current.onEnter?.(target);
            return true;
          }
          return applyEdit((s) => insertText(s, "\n"));
        }
        case "backspace":
          setActiveFamily(null);
          return applyEdit(deleteBackward);
        default:
          return false;
      }
    },
    [applyEdit, resolveTargetInput],
  );

  // A family character replaces the base character typed just before it
  // (ሀ then ሁ gives ሁ); otherwise it's inserted.
  const applyFamilyChar = useCallback(
    (char: string) => {
      const base = activeFamily?.value;
      return applyEdit(
        (s) => (base && replaceBeforeCaret(s, base, char)) || insertText(s, char),
      );
    },
    [activeFamily, applyEdit],
  );

  const flatKeys = useMemo(() => layout.flat(), [layout]);

  const familySlots = useMemo(
    () =>
      Math.max(
        0,
        ...flatKeys.map((k) => (k.children?.length ? k.children.length + 1 : 0)),
      ),
    [flatKeys],
  );

  const familyOptions = useMemo(
    () =>
      activeFamily?.value
        ? [activeFamily.value, ...(activeFamily.children ?? [])]
        : [],
    [activeFamily],
  );

  const pressKeyByName = useCallback(
    (name: string) => {
      const normalized = name.trim().toLowerCase();
      const key =
        flatKeys.find((k) => k.value === name || k.label === name) ??
        flatKeys.find((k) => k.type === normalized);
      if (key) return applyKey(key);
      // Family characters aren't keys of their own
      if (flatKeys.some((k) => k.children?.includes(name))) {
        return applyEdit((s) => insertText(s, name));
      }
      return false;
    },
    [flatKeys, applyKey, applyEdit],
  );

  const show = useCallback(() => {
    setVisible(true);
    setMinimized(false);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    latest.current.onClose?.();
  }, []);

  // Visibility callbacks fire on changes only, not on mount
  const prevVisible = useRef(visible);
  useEffect(() => {
    if (prevVisible.current === visible) return;
    prevVisible.current = visible;
    if (visible) latest.current.onShow?.();
    else latest.current.onHide?.();
  }, [visible]);

  const prevMinimized = useRef(minimized);
  useEffect(() => {
    if (prevMinimized.current === minimized) return;
    prevMinimized.current = minimized;
    latest.current.onMinimizeChange?.(minimized);
  }, [minimized]);

  const getState = useCallback(
    (): KeyboardState => ({
      value: valueRef.current,
      visible,
      minimized,
      mode,
      familyOptions,
      position,
      size,
      inputCount: inputsRef.current.length,
      hasTarget: resolveTargetInput() !== null,
    }),
    [visible, minimized, mode, familyOptions, position, size, resolveTargetInput],
  );

  const api: AmharicKeyboardRef = {
    addInput: (input) => {
      if (!registerInput(input)) return false;
      if (!currentInputRef.current) {
        currentInputRef.current = input;
        if (latest.current.value === undefined) valueRef.current = input.value || "";
      }
      return true;
    },
    removeInput: (input) => unregisterInput(input),
    switchToInput: (input) => {
      if (currentInputRef.current === input || !inputsRef.current.includes(input)) {
        return false;
      }
      currentInputRef.current = input;
      if (latest.current.value === undefined) valueRef.current = input.value;
      setActiveFamily(null);
      return true;
    },
    getCurrentInput: () => currentInputRef.current,
    getAllInputs: () => [...inputsRef.current],
    show,
    hide: () => setVisible(false),
    toggleMinimize: () => setMinimized((m) => !m),
    setMinimized: (m) => setMinimized(m),
    moveTo: (x, y) => setPosition({ x, y }),
    resize: (width, height) =>
      setSize({
        width: clamp(width, minWidth, maxWidth),
        height: clamp(height, minHeight, maxHeight),
      }),
    syncInput: () => {
      if (currentInputRef.current && latest.current.value === undefined) {
        valueRef.current = currentInputRef.current.value;
      }
    },
    getValue: () => valueRef.current,
    typeText: (text) => applyEdit((s) => insertText(s, text)),
    pressKey: pressKeyByName,
    backspace: (count = 1) => {
      let ok = false;
      for (let i = 0; i < Math.max(1, count); i++) ok = applyEdit(deleteBackward) || ok;
      return ok;
    },
    clear: () => applyEdit(() => ({ value: "", caret: 0 })),
    getState,
    getLayout: () => layout,
  };

  const apiRef = useRef(api);
  apiRef.current = api;

  useImperativeHandle(ref, () => api);

  // Agent bridge on window for browser automation and AI agents
  useEffect(() => {
    if (!exposeAs || typeof window === "undefined") return;
    const bridge = {
      tools: amharicKeyboardTools,
      run: (name: string, input?: Record<string, unknown>) =>
        runAmharicKeyboardTool(apiRef.current, name, input),
      typeText: (text: string) => apiRef.current.typeText(text),
      pressKey: (key: string) => apiRef.current.pressKey(key),
      backspace: (count?: number) => apiRef.current.backspace(count),
      clear: () => apiRef.current.clear(),
      getState: () => apiRef.current.getState(),
      getLayout: () => apiRef.current.getLayout(),
      show: () => apiRef.current.show(),
      hide: () => apiRef.current.hide(),
    };
    const w = window as unknown as Record<string, unknown>;
    w[exposeAs] = bridge;
    return () => {
      if (w[exposeAs] === bridge) delete w[exposeAs];
    };
  }, [exposeAs]);

  // Drag and resize with pointer events (mouse, touch and pen)
  const startInteraction = useCallback(
    (kind: Interaction["kind"], e: React.PointerEvent<HTMLElement>) => {
      if (kind === "drag" && (!canDrag || (e.target as HTMLElement).closest("button"))) {
        return;
      }
      if (kind === "resize" && !canResize) return;
      e.preventDefault();
      e.stopPropagation();
      setInteraction({
        kind,
        startX: e.clientX,
        startY: e.clientY,
        originX: position.x,
        originY: position.y,
        originWidth: size.width,
        originHeight: size.height,
      });
    },
    [canDrag, canResize, position, size],
  );

  useEffect(() => {
    if (!interaction) return;

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      const dx = e.clientX - interaction.startX;
      const dy = e.clientY - interaction.startY;
      const el = rootRef.current;

      if (interaction.kind === "drag") {
        const width = el?.offsetWidth ?? interaction.originWidth;
        const height = el?.offsetHeight ?? interaction.originHeight;
        setPosition({
          x: clamp(interaction.originX + dx, 0, Math.max(0, window.innerWidth - width)),
          y: clamp(interaction.originY + dy, 0, Math.max(0, window.innerHeight - height)),
        });
      } else {
        const maxW = Math.min(maxWidth, window.innerWidth - interaction.originX);
        const maxH = Math.min(maxHeight, window.innerHeight - interaction.originY);
        setSize({
          width: clamp(interaction.originWidth + dx, Math.min(minWidth, maxW), maxW),
          height: clamp(interaction.originHeight + dy, Math.min(minHeight, maxH), maxH),
        });
      }
    };

    const handleEnd = () => setInteraction(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [interaction, minWidth, minHeight, maxWidth, maxHeight]);

  // Keep a floating keyboard on screen when the viewport shrinks
  useEffect(() => {
    if (!isFloating) return;
    const handleResize = () => {
      const el = rootRef.current;
      if (!el) return;
      setPosition((p) => ({
        x: clamp(p.x, 0, Math.max(0, window.innerWidth - el.offsetWidth)),
        y: clamp(p.y, 0, Math.max(0, window.innerHeight - el.offsetHeight)),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFloating]);

  if (!visible) return null;

  if (minimized) {
    return (
      <button
        type="button"
        className={cx(
          "amharic-virtual-keyboard-minimized",
          !isFloating && "is-inline",
          classNames.minimized,
        )}
        data-theme={theme}
        data-amharic-keyboard="minimized"
        onClick={() => setMinimized(false)}
        title="Restore Amharic keyboard"
        aria-label="Restore Amharic keyboard"
      >
        <span aria-hidden="true">⌨</span>
        {!isFloating && <span className="keyboard-title">{title}</span>}
      </button>
    );
  }

  const dragHandleProps = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => startInteraction("drag", e),
    style: { cursor: canDrag ? "move" : undefined, touchAction: canDrag ? "none" : undefined },
  };

  const header = renderHeader ? (
    renderHeader({ title, minimize: () => setMinimized(true), close, dragHandleProps })
  ) : (
    <div className={cx("keyboard-header", classNames.header)} {...dragHandleProps}>
      <span className="keyboard-title">{title}</span>
      <div className="keyboard-header-actions">
        {minimizeButton && (
          <button
            type="button"
            className="keyboard-header-button"
            onClick={() => setMinimized(true)}
            aria-label="Minimize keyboard"
            title="Minimize"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
        )}
        {closeButton && (
          <button
            type="button"
            className="keyboard-header-button"
            onClick={close}
            aria-label="Close keyboard"
            title="Close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  const renderDefaultFamilyKey = (char: string, index: number) => (
    <button
      type="button"
      key={index}
      className={cx("keyboard-child-button", index === 0 && "is-base", classNames.familyKey)}
      data-key-type="family"
      data-key-value={char}
      onClick={() => applyFamilyChar(char)}
    >
      {char}
    </button>
  );

  const renderDefaultKey = (key: Key, id: string) => {
    const isActive = activeFamily === key;
    return (
      <button
        type="button"
        key={id}
        className={cx(
          "keyboard-key",
          `keyboard-key--${key.type}`,
          isActive && "is-active",
          classNames.key,
        )}
        data-key-type={key.type}
        data-key-value={
          key.type === "char" || key.type === "point" ? key.value ?? key.label : key.type
        }
        aria-label={KEY_ARIA_LABELS[key.type]}
        aria-pressed={key.children?.length ? isActive : undefined}
        onClick={() => applyKey(key)}
      >
        {key.label}
      </button>
    );
  };

  const rootStyle: React.CSSProperties =
    isFloating && !isDocked
      ? {
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          ...style,
        }
      : style;

  return (
    <div
      ref={rootRef}
      className={cx(
        "amharic-virtual-keyboard",
        `avk-${mode}`,
        isDocked && "is-docked",
        interaction && `is-${interaction.kind === "drag" ? "dragging" : "resizing"}`,
        className,
        classNames.root,
      )}
      style={rootStyle}
      data-theme={theme}
      data-amharic-keyboard="open"
      data-mode={mode}
      role="group"
      aria-label={typeof title === "string" ? title : "Amharic keyboard"}
      // Keep focus (and the caret) in the input while keys are pressed
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest("input, textarea, select")) {
          e.preventDefault();
        }
      }}
      onPointerDown={(e) => {
        lastPointerTypeRef.current = e.pointerType;
      }}
    >
      {showHeader && header}

      <div
        className={cx("keyboard-family-row", classNames.familyRow)}
        role="group"
        aria-label="Character family"
      >
        {Array.from({ length: familySlots }).map((_, i) => {
          const char = familyOptions[i];
          if (!char) {
            return <span key={i} className="keyboard-child-button is-empty" aria-hidden="true" />;
          }
          return renderFamilyKey ? (
            <React.Fragment key={i}>
              {renderFamilyKey(char, {
                press: () => applyFamilyChar(char),
                isBase: i === 0,
                renderDefault: () => renderDefaultFamilyKey(char, i),
              })}
            </React.Fragment>
          ) : (
            renderDefaultFamilyKey(char, i)
          );
        })}
      </div>

      {layout.map((row, rowIndex) => (
        <div key={rowIndex} className={cx("keyboard-row", classNames.row)}>
          {row.map((key, keyIndex) => {
            const id = `${rowIndex}-${keyIndex}`;
            return renderKey ? (
              <React.Fragment key={id}>
                {renderKey(key, {
                  press: () => applyKey(key),
                  isActive: activeFamily === key,
                  renderDefault: () => renderDefaultKey(key, id),
                })}
              </React.Fragment>
            ) : (
              renderDefaultKey(key, id)
            );
          })}
        </div>
      ))}

      {children}

      {canResize && (
        <div
          className={cx("resize-handle", classNames.resizeHandle)}
          onPointerDown={(e) => startInteraction("resize", e)}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

AmharicKeyboard.displayName = "AmharicKeyboard";
