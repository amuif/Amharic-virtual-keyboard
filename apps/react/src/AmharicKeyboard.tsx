import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef
} from 'react';
import { AmharicKeyboardProps, AmharicKeyboardRef, } from './types';
import './style.css';
import { amharicLayout } from '@amharic-keyboard/core';

interface ActiveFamily {
  value: string;
  children: string[];
}

export const AmharicKeyboard = forwardRef<AmharicKeyboardRef, AmharicKeyboardProps>(
  ({
    targetInput,
    targetInputs,
    layout = amharicLayout,
    draggable = true,
    showHeader = true,
    minimizeButton = true,
    closeButton = false,
    minWidth = 300,
    minHeight = 200,
    maxWidth = 800,
    maxHeight = 500,
    onClose,
    className = '',
    style = {},
    children
  }, ref) => {
    const [value, setValue] = useState<string>('');
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
      height: minHeight
    });

    const keyboardRef = useRef<HTMLDivElement>(null);
    const currentInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const inputsRef = useRef<(HTMLInputElement | HTMLTextAreaElement)[]>([]);
    const cleanupRef = useRef<(() => void)[]>([]);

    // Setup input listeners
    const setupInputListeners = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
      const focusHandler = () => {
        if (currentInputRef.current !== input && inputsRef.current.includes(input)) {
          currentInputRef.current = input;
          setValue(input.value);
          setActiveFamily(null);
          setCurrentChildren([]);

          if (keyboardRef.current) {
            keyboardRef.current.style.opacity = '1';
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

      input.addEventListener('focus', focusHandler);
      input.addEventListener('input', inputHandler);
      input.addEventListener('change', changeHandler);

      // Return cleanup function
      return () => {
        input.removeEventListener('focus', focusHandler);
        input.removeEventListener('input', inputHandler);
        input.removeEventListener('change', changeHandler);
      };
    }, []);

    // Initialize inputs
    useEffect(() => {
      // Clear previous cleanup functions
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];

      if (targetInputs && targetInputs.length > 0) {
        // Filter out null/undefined inputs
        const validInputs = targetInputs.filter(
          (input): input is HTMLInputElement | HTMLTextAreaElement =>
            input != null &&
            typeof input === 'object' &&
            'addEventListener' in input
        );

        inputsRef.current = validInputs;

        if (validInputs.length > 0) {
          currentInputRef.current = validInputs[0] ?? null;
          setValue(currentInputRef.current?.value || '');

          // Setup listeners for all valid inputs
          validInputs.forEach(input => {
            const cleanup = setupInputListeners(input);
            if (cleanup) cleanupRef.current.push(cleanup);
          });
        }
      } else if (targetInput && 'addEventListener' in targetInput) {
        inputsRef.current = [targetInput];
        const cleanup = setupInputListeners(targetInput);
        if (cleanup) cleanupRef.current.push(cleanup);
        currentInputRef.current = targetInput;
        setValue(targetInput.value || '');
      }

      // Global click listener for opacity
      const handleDocumentClick = (e: MouseEvent) => {
        if (keyboardRef.current && !keyboardRef.current.contains(e.target as Node)) {
          keyboardRef.current.style.opacity = '0.7';
        }
      };

      document.addEventListener('click', handleDocumentClick);

      return () => {
        document.removeEventListener('click', handleDocumentClick);
        // Clean up all input listeners
        cleanupRef.current.forEach(cleanup => cleanup());
        cleanupRef.current = [];
      };
    }, [targetInput, targetInputs, setupInputListeners]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
        if (!inputsRef.current.includes(input)) {
          inputsRef.current.push(input);
          const cleanup = setupInputListeners(input);
          if (cleanup) cleanupRef.current.push(cleanup);

          if (!currentInputRef.current) {
            currentInputRef.current = input;
            setValue(input.value || '');
          }
          return true;
        }
        return false;
      },

      removeInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
        const index = inputsRef.current.indexOf(input);
        if (index > -1) {
          inputsRef.current.splice(index, 1);

          // Remove cleanup function
          if (cleanupRef.current[index]) {
            cleanupRef.current[index]();
            cleanupRef.current.splice(index, 1);
          }

          if (currentInputRef.current === input) {
            currentInputRef.current = inputsRef.current[0] || null;
            setValue(currentInputRef.current?.value || '');
          }
          return true;
        }
        return false;
      },

      switchToInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
        if (currentInputRef.current !== input && inputsRef.current.includes(input)) {
          currentInputRef.current = input;
          setValue(input.value);
          setActiveFamily(null);
          setCurrentChildren([]);

          if (keyboardRef.current) {
            keyboardRef.current.style.opacity = '1';
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

      getValue: () => value
    }));

    // Drag functionality
    const handleDragStart = useCallback((e: React.MouseEvent) => {
      if (!draggable || !keyboardRef.current) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.classList.contains('resize-handle')) {
        return;
      }

      setIsDragging(true);
      const rect = keyboardRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }, [draggable]);

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
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
      }

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }, [isDragging, dragOffset]);

    // Resize functionality
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height
      });
    }, [size]);

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
            setPosition(pos => ({ ...pos, x: Math.max(0, newLeft) }));
          }

          if (rect.bottom > window.innerHeight) {
            const newTop = window.innerHeight - newHeight;
            setPosition(pos => ({ ...pos, y: Math.max(0, newTop) }));
          }
        }
      };

      const handleResizeEnd = () => {
        setIsResizing(false);
      };

      if (isResizing) {
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
      }

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }, [isResizing, resizeStart, minWidth, minHeight, maxWidth, maxHeight]);

    // Keyboard input handling
    const insertCharacter = useCallback((char: string) => {
      const newValue = value + char;
      setValue(newValue);
      syncInput(newValue);
    }, [value]);

    const syncInput = useCallback((newValue: string) => {
      if (currentInputRef.current) {
        currentInputRef.current.value = newValue;
        currentInputRef.current.focus();
        currentInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        setValue(currentInputRef.current.value);
      }
    }, []);

    const handleKeyPress = useCallback((key: any) => {
      if (!currentInputRef.current) return;

      if (key.type === 'char' && key.children?.length) {
        const family = { value: key.value, children: key.children };
        setActiveFamily(family);
        insertCharacter(key.value);
        setCurrentChildren([key.value, ...key.children]);
        return;
      }

      setActiveFamily(null);
      setCurrentChildren([]);

      if (key.type === 'char' || key.type === 'point') {
        insertCharacter(key.value || '');
      } else if (key.type === 'space') {
        insertCharacter(' ');
      } else if (key.type === 'enter') {
        insertCharacter('\n');
      } else if (key.type === 'backspace') {
        const newValue = value.slice(0, -1);
        setValue(newValue);
        syncInput(newValue);
      }
    }, [value, insertCharacter, syncInput]);

    const handleChildButtonClick = useCallback((char: string) => {
      if (!char || !activeFamily) return;

      const isSameFamily = [activeFamily.value, ...activeFamily.children].includes(char);

      if (isSameFamily) {
        const newValue = value.slice(0, -1) + char;
        setValue(newValue);
        syncInput(newValue);
      } else {
        insertCharacter(char);
      }
    }, [activeFamily, value, insertCharacter, syncInput]);

    if (!isVisible) return null;

    if (isMinimized) {
      return (
        <div
          className="amharic-virtual-keyboard-minimized"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#2c3e50',
            color: 'white',
            cursor: 'pointer',
            zIndex: 10000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            fontSize: '24px',
            userSelect: 'none',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setIsMinimized(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
          }}
          title="Click to restore Amharic Keyboard"
        >
          ⌨
        </div>
      );
    }

    const keyboardStyle: React.CSSProperties = {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0px 10px',
      background: '#e0e0e0',
      border: '1px solid #ccc',
      borderRadius: '5px',
      zIndex: 10000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      userSelect: 'none',
      transition: isDragging || isResizing ? 'none' : 'all 0.3s ease',
      cursor: isDragging ? 'grabbing' : 'default',
      overflow: 'hidden',
      ...style
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
              width: '100%',
              padding: '8px 12px',
              background: '#2c3e50',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: draggable ? 'move' : 'default',
              borderRadius: '5px 5px 0 0',
              marginBottom: '10px',
              userSelect: 'none'
            }}
            onMouseDown={handleDragStart}
          >
            <span style={{ fontWeight: 'bold' }}>Amharic Keyboard</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {minimizeButton && (
                <button
                  onClick={() => setIsMinimized(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}
                >
                  −
                </button>
              )}
              {closeButton && onClose && (
                <button
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Child buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '10px',
            width: '100%',
            flexWrap: 'wrap',
            gap: '2px'
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const char = currentChildren[i];
            return (
              <button
                key={i}
                className="keyboard-child-button"
                style={{
                  margin: '2px',
                  padding: '10px',
                  minWidth: '40px',
                  minHeight: '40px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  // background: char ? '#d3d3d3' : '#e0e0e0',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  opacity: char ? 1 : 0.5
                }}
                onClick={() => char && handleChildButtonClick(char)}
              >
                {char || ''}
              </button>
            );
          })}
        </div>

        {/* Keyboard rows */}
        {layout.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '5px',
              width: '100%'
            }}
          >
            {row.map((key, keyIndex) => (
              <button
                key={keyIndex}
                className="keyboard-key"
                style={{
                  margin: '2px',
                  padding: '8px',
                  minWidth: '35px',
                  minHeight: '40px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  // background: 'white',
                  flex: 1
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
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '20px',
            height: '20px',
            cursor: 'se-resize',
            background: 'linear-gradient(135deg, transparent 50%, #888 50%)'
          }}
          onMouseDown={handleResizeStart}
        />
      </div>
    );
  }
);

AmharicKeyboard.displayName = 'AmharicKeyboard';
