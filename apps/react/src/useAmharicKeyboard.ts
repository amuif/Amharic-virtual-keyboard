import { useRef, useCallback, useMemo } from 'react';
import { AmharicKeyboardRef } from './types';

type EditableElement = HTMLInputElement | HTMLTextAreaElement;

// A callback ref that also exposes `.current`, so it can be passed as
// `ref={keyboardRef}` and still be read like a regular ref object.
export type AmharicKeyboardRefHandle = ((instance: AmharicKeyboardRef | null) => void) & {
  readonly current: AmharicKeyboardRef | null;
};

export const useAmharicKeyboard = () => {
  const instanceRef = useRef<AmharicKeyboardRef | null>(null);
  const registeredInputsRef = useRef<EditableElement[]>([]);

  // Inputs added through the hook are re-registered every time the keyboard
  // mounts, so conditionally rendering the keyboard doesn't disconnect them.
  const keyboardRef = useMemo(() => {
    const setRef = (instance: AmharicKeyboardRef | null) => {
      instanceRef.current = instance;
      if (instance) {
        registeredInputsRef.current.forEach((input) => instance.addInput(input));
      }
    };
    Object.defineProperty(setRef, 'current', { get: () => instanceRef.current });
    return setRef as AmharicKeyboardRefHandle;
  }, []);

  const addInput = useCallback((input: EditableElement) => {
    if (!registeredInputsRef.current.includes(input)) {
      registeredInputsRef.current.push(input);
    }
    if (keyboardRef.current?.addInput) {
      return keyboardRef.current.addInput(input);
    }
    return false;
  }, []);

  const removeInput = useCallback((input: EditableElement) => {
    registeredInputsRef.current = registeredInputsRef.current.filter((i) => i !== input);
    if (keyboardRef.current?.removeInput) {
      return keyboardRef.current.removeInput(input);
    }
    return false;
  }, []);

  const switchToInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
    if (keyboardRef.current?.switchToInput) {
      return keyboardRef.current.switchToInput(input);
    }
    return false;
  }, []);

  const getCurrentInput = useCallback((): HTMLInputElement | HTMLTextAreaElement | null => {
    if (keyboardRef.current?.getCurrentInput) {
      return keyboardRef.current.getCurrentInput();
    }
    return null;
  }, []);

  const getAllInputs = useCallback((): (HTMLInputElement | HTMLTextAreaElement)[] => {
    if (keyboardRef.current?.getAllInputs) {
      return keyboardRef.current.getAllInputs();
    }
    return [];
  }, []);

  const showKeyboard = useCallback(() => {
    if (keyboardRef.current?.show) {
      keyboardRef.current.show();
    }
  }, []);

  const hideKeyboard = useCallback(() => {
    if (keyboardRef.current?.hide) {
      keyboardRef.current.hide();
    }
  }, []);

  const minimizeKeyboard = useCallback(() => {
    keyboardRef.current?.setMinimized(true);
  }, []);

  const restoreKeyboard = useCallback(() => {
    keyboardRef.current?.setMinimized(false);
  }, []);

  const moveKeyboard = useCallback((x: number, y: number) => {
    if (keyboardRef.current?.moveTo) {
      keyboardRef.current.moveTo(x, y);
    }
  }, []);

  const resizeKeyboard = useCallback((width: number, height: number) => {
    if (keyboardRef.current?.resize) {
      keyboardRef.current.resize(width, height);
    }
  }, []);

  const syncInput = useCallback(() => {
    if (keyboardRef.current?.syncInput) {
      keyboardRef.current.syncInput();
    }
  }, []);

  const getValue = useCallback((): string => {
    if (keyboardRef.current?.getValue) {
      return keyboardRef.current.getValue();
    }
    return '';
  }, []);

  const typeText = useCallback((text: string) => keyboardRef.current?.typeText(text) ?? false, []);

  const pressKey = useCallback((key: string) => keyboardRef.current?.pressKey(key) ?? false, []);

  const backspace = useCallback((count?: number) => keyboardRef.current?.backspace(count) ?? false, []);

  const clear = useCallback(() => keyboardRef.current?.clear() ?? false, []);

  const getState = useCallback(() => keyboardRef.current?.getState() ?? null, []);

  return {
    keyboardRef,
    addInput,
    removeInput,
    switchToInput,
    getCurrentInput,
    getAllInputs,
    showKeyboard,
    hideKeyboard,
    minimizeKeyboard,
    restoreKeyboard,
    moveKeyboard,
    resizeKeyboard,
    syncInput,
    getValue,
    typeText,
    pressKey,
    backspace,
    clear,
    getState
  };
};
