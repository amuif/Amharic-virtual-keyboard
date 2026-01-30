export type KeyType =
  | 'char'
  | 'space'
  | 'shift'
  | 'backspace'
  | 'enter'
  | 'point'

export interface KeyboardKey {
  type: KeyType;
  label: string;
  value?: string;
  children?: string[]
}

export interface KeyboardProps {
  targetInput?: HTMLInputElement | HTMLTextAreaElement;
  targetInputs?: (HTMLInputElement | HTMLTextAreaElement)[];
  layout?: KeyboardLayout;
  draggable?: boolean;
  showHeader?: boolean;
  minimizeButton?: boolean;
  closeButton?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ActiveFamily {
  value: string;
  children: string[];
}
export type KeyboardRow = KeyboardKey[];
export type KeyboardLayout = KeyboardRow[];
export type AmharicKeyboardProps = KeyboardProps;
