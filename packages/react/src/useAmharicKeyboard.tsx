import { useRef, useCallback, useEffect } from 'react';
import { UseAmharicKeyboardReturn } from '../types';


export const useAmharicKeyboard = (): UseAmharicKeyboardReturn => {
  const keyboardRef = useRef<any>(null);
  const inputsRef = useRef<(HTMLInputElement | HTMLTextAreaElement)[]>([]);

  // Store handlers for cleanup
  const inputHandlersRef = useRef<Map<
    HTMLInputElement | HTMLTextAreaElement, 
    { focus: () => void; input: () => void; change: () => void }
  >>(new Map());

  const setKeyboardRef = useCallback((ref: any) => {
    keyboardRef.current = ref;
  }, []);

  const addInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
    if (!inputsRef.current.includes(input)) {
      inputsRef.current.push(input);
      
      // Create handlers
      const focusHandler = () => {
        if (keyboardRef.current?.switchToInput) {
          keyboardRef.current.switchToInput(input);
        }
      };
      
      const inputHandler = () => {
        if (keyboardRef.current?.syncInput) {
          keyboardRef.current.syncInput();
        }
      };
      
      const changeHandler = () => {
        if (keyboardRef.current?.syncInput) {
          keyboardRef.current.syncInput();
        }
      };
      
      // Store handlers for cleanup
      inputHandlersRef.current.set(input, {
        focus: focusHandler,
        input: inputHandler,
        change: changeHandler
      });
      
      // Add event listeners
      input.addEventListener('focus', focusHandler);
      input.addEventListener('input', inputHandler);
      input.addEventListener('change', changeHandler);
      
      // If keyboard exists and has addInput method, use it
      if (keyboardRef.current?.addInput) {
        keyboardRef.current.addInput(input);
      }
    }
  }, []);

  const removeInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
    const index = inputsRef.current.indexOf(input);
    if (index > -1) {
      inputsRef.current.splice(index, 1);
      
      // Remove event listeners
      const handlers = inputHandlersRef.current.get(input);
      if (handlers) {
        input.removeEventListener('focus', handlers.focus);
        input.removeEventListener('input', handlers.input);
        input.removeEventListener('change', handlers.change);
        inputHandlersRef.current.delete(input);
      }
      
      // If keyboard exists and has removeInput method, use it
      if (keyboardRef.current?.removeInput) {
        keyboardRef.current.removeInput(input);
      }
    }
  }, []);

  const switchToInput = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
    if (keyboardRef.current?.switchToInput) {
      keyboardRef.current.switchToInput(input);
    }
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
    return [...inputsRef.current];
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all event listeners
      inputsRef.current.forEach(input => {
        const handlers = inputHandlersRef.current.get(input);
        if (handlers) {
          input.removeEventListener('focus', handlers.focus);
          input.removeEventListener('input', handlers.input);
          input.removeEventListener('change', handlers.change);
        }
      });
      inputHandlersRef.current.clear();
      inputsRef.current = [];
    };
  }, []);

  return {
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
    setKeyboardRef
  };
};

// Alternative hook for managing keyboard instance
export const useKeyboardInstance = () => {
  const instanceRef = useRef<any>(null);
  
  const setInstance = useCallback((instance: any) => {
    instanceRef.current = instance;
  }, []);
  
  const getInstance = useCallback(() => instanceRef.current, []);
  
  return { setInstance, getInstance };
};
