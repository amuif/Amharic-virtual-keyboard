import { KeyboardLayout } from "@amharic-keyboard/core";
export interface AmharicKeyboardProps {
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

export interface AmharicKeyboardRef {
  addInput: (input: HTMLInputElement | HTMLTextAreaElement) => boolean;
  removeInput: (input: HTMLInputElement | HTMLTextAreaElement) => boolean;
  switchToInput: (input: HTMLInputElement | HTMLTextAreaElement) => boolean;
  getCurrentInput: () => HTMLInputElement | HTMLTextAreaElement | null;
  getAllInputs: () => (HTMLInputElement | HTMLTextAreaElement)[];
  show: () => void;
  hide: () => void;
  toggleMinimize: () => void;
  moveTo: (x: number, y: number) => void;
  resize: (width: number, height: number) => void;
  syncInput: () => void;
  getValue: () => string;
}
