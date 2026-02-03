import { useRef, useCallback } from 'react';
import { AmharicKeyboardRef } from './types';

export const useAmharicKeyboard = () => {
  const keyboardRef = useRef<AmharicKeyboardRef>(null);

  const addInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
    if (keyboardRef.current?.addInput) {
      return keyboardRef.current.addInput(input);
    }
    return false;
  }, []);

  const removeInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
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
    if (keyboardRef.current?.toggleMinimize) {
      keyboardRef.current.toggleMinimize();
    }
  }, []);

  const restoreKeyboard = useCallback(() => {
    if (keyboardRef.current?.toggleMinimize) {
      keyboardRef.current.toggleMinimize();
    }
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
    getValue
  };
};
