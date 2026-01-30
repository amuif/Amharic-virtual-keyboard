export interface AmharicKeyboardRef {
  addInput: (input: HTMLInputElement | HTMLTextAreaElement) => void;
  removeInput: (input: HTMLInputElement | HTMLTextAreaElement) => void;
  switchToInput: (input: HTMLInputElement | HTMLTextAreaElement) => void;
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
export interface UseAmharicKeyboardReturn {
  addInput: (input: HTMLInputElement | HTMLTextAreaElement) => void;
  removeInput: (input: HTMLInputElement | HTMLTextAreaElement) => void;
  switchToInput: (input: HTMLInputElement | HTMLTextAreaElement) => void;
  getCurrentInput: () => HTMLInputElement | HTMLTextAreaElement | null;
  getAllInputs: () => (HTMLInputElement | HTMLTextAreaElement)[];
  showKeyboard: () => void;
  hideKeyboard: () => void;
  minimizeKeyboard: () => void;
  restoreKeyboard: () => void;
  moveKeyboard: (x: number, y: number) => void;
  resizeKeyboard: (width: number, height: number) => void;
  setKeyboardRef: (ref: any) => void;
}

