import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef
} from 'react';
import { amharicLayout } from '../../core/layouts/amharic';
import type { ActiveFamily, AmharicKeyboardProps, } from '../../core/types';
import type { AmharicKeyboardRef } from '../types/'
import './AmharicKeyboard.css';

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
    maxWidth = 700,
    maxHeight = 350,
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
    const [restoreFrom, setRestoreFrom] = useState<{ x: number; y: number } | null>(null);
    const [isMinimizing, setIsMinimizing] = useState(false);

    const keyboardRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const resizeHandleRef = useRef<HTMLDivElement>(null);
    const currentInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const inputsRef = useRef<(HTMLInputElement | HTMLTextAreaElement)[]>([]);
    const inputHandlersRef = useRef<Map<
      HTMLInputElement | HTMLTextAreaElement,
      { focus: () => void; input: () => void; change: () => void; cut: () => void; paste: () => void }
    >>(new Map());

    useImperativeHandle(ref, () => ({
      addInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
        if (!inputsRef.current.includes(input)) {
          inputsRef.current.push(input);
          setupInputListeners(input);

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
          cleanupInputListeners(input);

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

      const cutHandler = () => {
        if (currentInputRef.current === input) {
          setTimeout(() => {
            setValue(input.value);
          }, 0);
        }
      };

      const pasteHandler = () => {
        if (currentInputRef.current === input) {
          setTimeout(() => {
            setValue(input.value);
          }, 0);
        }
      };

      // Store handlers
      inputHandlersRef.current.set(input, {
        focus: focusHandler,
        input: inputHandler,
        change: changeHandler,
        cut: cutHandler,
        paste: pasteHandler
      });

      // Add listeners
      input.addEventListener('focus', focusHandler);
      input.addEventListener('input', inputHandler);
      input.addEventListener('change', changeHandler);
      input.addEventListener('cut', cutHandler);
      input.addEventListener('paste', pasteHandler);
    }, []);

    const cleanupInputListeners = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
      const handlers = inputHandlersRef.current.get(input);
      if (handlers) {
        input.removeEventListener('focus', handlers.focus);
        input.removeEventListener('input', handlers.input);
        input.removeEventListener('change', handlers.change);
        input.removeEventListener('cut', handlers.cut);
        input.removeEventListener('paste', handlers.paste);
        inputHandlersRef.current.delete(input);
      }
    }, []);

    useEffect(() => {
      if (restoreFrom) {
        const t = setTimeout(() => setRestoreFrom(null), 300);
        return () => clearTimeout(t);
      }
    }, [restoreFrom]);
    useEffect(() => {
      if (targetInputs) {
        const validInputs = targetInputs.filter(input => input !== null && input !== undefined);
        inputsRef.current = validInputs;

        if (validInputs.length > 0) {
          currentInputRef.current = validInputs[0];
          setValue(currentInputRef.current.value || '');

          validInputs.forEach(input => {
            if (input) {
              setupInputListeners(input);
            }
          });
        }
      } else if (targetInput) {
        inputsRef.current = [targetInput];
        setupInputListeners(targetInput);
        currentInputRef.current = targetInput;
        setValue(targetInput.value || '');
      }

      const handleDocumentClick = (e: MouseEvent) => {
        if (keyboardRef.current && !keyboardRef.current.contains(e.target as Node)) {
          keyboardRef.current.style.opacity = '1';
        }
      };

      document.addEventListener('click', handleDocumentClick);

      return () => {
        document.removeEventListener('click', handleDocumentClick);
        // Clean up all input listeners
        inputsRef.current.forEach(input => cleanupInputListeners(input));
        inputHandlersRef.current.clear();
      };
    }, [targetInput, targetInputs, setupInputListeners, cleanupInputListeners]);

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

    const replaceLastCharacter = useCallback((char: string) => {
      const newValue = value.slice(0, -1) + char;
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

    const isSameFamily = useCallback((char: string): boolean => {
      return !!activeFamily &&
        [activeFamily.value, ...activeFamily.children].includes(char);
    }, [activeFamily]);

    const handleChildButtonClick = useCallback((char: string, index: number) => {
      if (!char || !activeFamily) return;

      if (isSameFamily(char)) {
        replaceLastCharacter(char);
      } else {
        insertCharacter(char);
      }
    }, [activeFamily, isSameFamily, insertCharacter, replaceLastCharacter]);

    const toggleMinimize = useCallback(() => {
      if (isMinimized) {
        // When restoring, clear any restoreFrom state and show keyboard
        setRestoreFrom(null);
        setIsMinimized(false);
        return;
      }

      // Start minimize animation
      setIsMinimizing(true);

      // Store current position for restore
      if (keyboardRef.current) {
        const rect = keyboardRef.current.getBoundingClientRect();
        setRestoreFrom({
          x: rect.right,
          y: rect.bottom
        });
      }

      setTimeout(() => {
        setIsMinimizing(false);
        setIsMinimized(true);
        setRestoreFrom(null);
      }, 300);

    }, [isMinimized]);

    const handleClose = useCallback(() => {
      if (onClose) {
        onClose();
      }
    }, [onClose]);


    if (!isVisible && !isMinimizing) return null;

    if (isMinimized) {
      return (
        <div
          className="amharic-virtual-keyboard-minimized"
          onClick={toggleMinimize}
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

    const restoredPosition = restoreFrom
      ? {
        x: Math.max(0, restoreFrom.x - size.width),
        y: Math.max(0, restoreFrom.y - size.height)
      }
      : position;

    const collapseTransform = restoreFrom
      ? {
        translateX: restoreFrom.x - (position.x + size.width),
        translateY: restoreFrom.y - (position.y + size.height)
      }
      : { translateX: 0, translateY: 0 };

    const keyboardStyle: React.CSSProperties = {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      minWidth: `${minWidth}px`,
      minHeight: `${minHeight}px`,
      maxWidth: `${Math.min(maxWidth, window.innerWidth * 0.9)}px`,
      maxHeight: `${Math.min(maxHeight, window.innerHeight * 0.9)}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0px 10px',
      background: '#e0e0e0',
      border: '1px solid #ccc',
      borderRadius: '5px',
      zIndex: 10000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      userSelect: 'none',
      boxSizing: 'border-box',

      // Only transition specific properties
      transition: isDragging || isResizing ? 'none' : 'left 0.2s, top 0.2s, width 0.2s, height 0.2s',

      cursor: isDragging ? 'grabbing' : 'default',
      ...style
    };

    return (
      <div
        ref={keyboardRef}
        className={`amharic-virtual-keyboard ${isMinimizing ? 'amharic-minimizing' : ''} ${restoreFrom ? 'amharic-restoring' : ''} ${className}`}
        style={keyboardStyle}
      >
        {showHeader && (
          <div
            ref={headerRef}
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
              userSelect: 'none',
              flexShrink: 0
            }}
            onMouseDown={draggable ? handleDragStart : undefined}
          >
            <span style={{ fontWeight: 'bold' }}>Amharic Keyboard</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {minimizeButton && (
                <button
                  onClick={toggleMinimize}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    width: '30px',
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
            </div>
          </div>
        )}

        <div
          className="child-buttons-container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '10px',
            width: '100%',
            flexWrap: 'wrap',
            gap: '2px',
            minHeight: '50px'
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const char = currentChildren[i];
            const isActive = char && activeFamily;

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
                  background: isActive ? '#d3d3d3' : '#e0e0e0',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  opacity: 1,
                  transition: 'all 0.2s',
                  boxShadow: char ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (char) e.currentTarget.style.background = '#339af0';
                }}
                onMouseLeave={(e) => {
                  if (char) e.currentTarget.style.background = '#d3d3d3';
                }}
                onClick={() => char && handleChildButtonClick(char, i)}
              >
                {char || ''}
              </button>
            );
          })}
        </div>

        {/* Main keyboard rows */}
        {layout.map((row, rowIndex: number) => (
          <div
            key={rowIndex}
            className="keyboard-row"
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '5px',
              width: '100%',
              flexWrap: 'nowrap',
              flexShrink: 0
            }}
          >
            {row.map((key, keyIndex: number) => (
              <button
                key={keyIndex}
                className="keyboard-key"
                style={{
                  margin: '2px',
                  padding: '8px',
                  minWidth: '35px',
                  minHeight: '40px',
                  fontSize: 'clamp(14px, 1.5vw, 18px)',
                  cursor: 'pointer',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: 'white',
                  transition: 'all 0.2s',
                  flex: 1,
                  maxWidth: key.type === 'space' ? '150px' : '70px',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (key.type === 'char') {
                    e.currentTarget.style.background = '#339af0';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (key.type === 'char') {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = 'black';
                  }
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
          ref={resizeHandleRef}
          className="resize-handle"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '20px',
            height: '20px',
            cursor: 'se-resize',
            background: 'linear-gradient(135deg, transparent 50%, #888 50%)',
            borderRadius: '0 0 5px 0',
            zIndex: 10001,
            opacity: 1,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={() => {
            if (resizeHandleRef.current) {
              resizeHandleRef.current.style.opacity = '1';
            }
          }}
          onMouseLeave={() => {
            if (resizeHandleRef.current && !isResizing) {
              resizeHandleRef.current.style.opacity = '1';
            }
          }}
          onMouseDown={handleResizeStart}
        />
      </div>
    );
  }
);

AmharicKeyboard.displayName = 'AmharicKeyboard';
