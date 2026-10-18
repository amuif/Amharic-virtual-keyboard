import type { ReactNode, CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { Key, KeyboardLayout } from "@amharic-keyboard/core";

export type EditableElement = HTMLInputElement | HTMLTextAreaElement;

export type KeyboardTheme = "light" | "dark" | "auto";
export type KeyboardMode = "floating" | "inline";

export interface KeyboardPosition {
  x: number;
  y: number;
}

export interface KeyboardSize {
  width: number;
  height: number;
}

/** Class names for individual parts, appended to the built-in ones. */
export interface KeyboardClassNames {
  root?: string;
  header?: string;
  familyRow?: string;
  familyKey?: string;
  row?: string;
  key?: string;
  minimized?: string;
  resizeHandle?: string;
}

export interface KeyRenderProps {
  /** Applies the key exactly like a click on the default key would. */
  press: () => void;
  /** True for the base key of the family currently shown in the family row. */
  isActive: boolean;
  /** Renders the built-in key button, to wrap or decorate it. */
  renderDefault: () => ReactNode;
}

export interface FamilyKeyRenderProps {
  press: () => void;
  /** True for the base character of the family (e.g. ሀ for ሀ ሁ ሂ ...). */
  isBase: boolean;
  renderDefault: () => ReactNode;
}

export interface HeaderRenderProps {
  title: ReactNode;
  minimize: () => void;
  close: () => void;
  /** Spread onto the element that should act as the drag handle. */
  dragHandleProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    style: CSSProperties;
  };
}

export interface KeyboardState {
  value: string;
  visible: boolean;
  minimized: boolean;
  mode: KeyboardMode;
  /** Characters currently offered in the family row (base first). */
  familyOptions: string[];
  position: KeyboardPosition;
  size: KeyboardSize;
  inputCount: number;
  hasTarget: boolean;
}

export interface AmharicKeyboardProps {
  targetInput?: EditableElement | null;
  targetInputs?: (EditableElement | null | undefined)[];
  layout?: KeyboardLayout;

  /** Controlled value. When set, edits are reported through `onChange`. */
  value?: string;
  /** Initial value of the internal buffer when no input is attached. */
  defaultValue?: string;
  onChange?: (value: string) => void;

  /** `floating` is a draggable window; `inline` renders in the page flow. */
  mode?: KeyboardMode;
  theme?: KeyboardTheme;
  title?: ReactNode;

  draggable?: boolean;
  resizable?: boolean;
  showHeader?: boolean;
  minimizeButton?: boolean;
  closeButton?: boolean;
  defaultVisible?: boolean;
  defaultMinimized?: boolean;
  defaultPosition?: KeyboardPosition;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Below this viewport width a floating keyboard docks to the bottom. */
  compactBreakpoint?: number;
  /** Move focus back to the target input after a key press (skipped for touch). */
  refocusInput?: boolean;

  /** Called before a key is applied. Return `false` to cancel it. */
  onKeyPress?: (key: Key) => boolean | void;
  /** Called for the enter key on single-line inputs (they can't hold newlines). */
  onEnter?: (input: EditableElement | null) => void;
  onShow?: () => void;
  onHide?: () => void;
  onMinimizeChange?: (minimized: boolean) => void;
  onClose?: () => void;

  renderKey?: (key: Key, props: KeyRenderProps) => ReactNode;
  renderFamilyKey?: (char: string, props: FamilyKeyRenderProps) => ReactNode;
  renderHeader?: (props: HeaderRenderProps) => ReactNode;

  /**
   * Registers the agent API on `window[exposeAs]` (e.g. "amharicKeyboard") so
   * browser automation and AI agents can drive the keyboard.
   */
  exposeAs?: string;

  className?: string;
  classNames?: KeyboardClassNames;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface AmharicKeyboardRef {
  addInput: (input: EditableElement) => boolean;
  removeInput: (input: EditableElement) => boolean;
  switchToInput: (input: EditableElement) => boolean;
  getCurrentInput: () => EditableElement | null;
  getAllInputs: () => EditableElement[];
  show: () => void;
  hide: () => void;
  toggleMinimize: () => void;
  setMinimized: (minimized: boolean) => void;
  moveTo: (x: number, y: number) => void;
  resize: (width: number, height: number) => void;
  syncInput: () => void;
  getValue: () => string;

  /** Inserts any text at the caret, bypassing the layout. */
  typeText: (text: string) => boolean;
  /** Presses a layout key by value or label (e.g. "ሀ", "⌫", "space"). */
  pressKey: (key: string) => boolean;
  backspace: (count?: number) => boolean;
  clear: () => boolean;
  getState: () => KeyboardState;
  getLayout: () => KeyboardLayout;
}
