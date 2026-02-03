import { amharicLayout } from "@amharic-keyboard/core";
import { KeyboardLayout } from "@amharic-keyboard/core";

interface AmharicKeyboardOptions {
  targetInput?: HTMLInputElement | HTMLTextAreaElement;
  targetInputs?: (HTMLInputElement | HTMLTextAreaElement)[];
  layout?: KeyboardLayout;
  container?: HTMLElement;
  draggable?: boolean;
  showHeader?: boolean;
  minimizeButton?: boolean;
  closeButton?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class AmharicKeyboard {
  private value: string = '';
  private layout: KeyboardLayout;
  private keyboardElement: HTMLElement;
  private targetInput: HTMLInputElement | HTMLTextAreaElement | null = null;
  private targetInputs: (HTMLInputElement | HTMLTextAreaElement)[] = [];
  private childButtonsContainer: HTMLElement;
  private headerElement: HTMLElement | null = null;
  private resizeHandle: HTMLElement | null = null;

  private currentChildren: string[] = [];
  private activeFamily: { value: string; children: string[] } | null = null;

  // Drag variables
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private originalX: number = 0;
  private originalY: number = 0;

  // Resize variables
  private isResizing: boolean = false;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  private resizeStartWidth: number = 0;
  private resizeStartHeight: number = 0;

  // Size constraints
  private minWidth: number;
  private minHeight: number;
  private maxWidth: number;
  private maxHeight: number;

  // Minimized state
  private isMinimized: boolean = false;
  private minimizedElement: HTMLElement | null = null;

  constructor(options: AmharicKeyboardOptions) {
    this.layout = options.layout || amharicLayout;

    // Set size constraints with defaults
    this.minWidth = options.minWidth || 300;
    this.minHeight = options.minHeight || 200;
    this.maxWidth = options.maxWidth || 800;
    this.maxHeight = options.maxHeight || 500;

    this.keyboardElement = document.createElement('div');
    this.keyboardElement.className = 'amharic-virtual-keyboard';

    // Main keyboard styles
    Object.assign(this.keyboardElement.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0px 10px',
      background: '#e0e0e0',
      border: '1px solid #ccc',
      borderRadius: '5px',
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: '10000',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      userSelect: 'none',
      transition: 'all 0.3s ease',
      minWidth: `${this.minWidth}px`,
      minHeight: `${this.minHeight}px`,
      width: `${this.minWidth}px`,
      height: `${this.minHeight}px`,
      resize: 'none',
      overflow: 'hidden',
      maxWidth: '90vw',
      maxHeight: '90vh'
    } as CSSStyleDeclaration);

    // Add header if enabled
    if (options.showHeader !== false) {
      this.createHeader(options.minimizeButton, options.closeButton);
    }

    // CHILD ROW
    this.childButtonsContainer = document.createElement('div');
    this.childButtonsContainer.style.cssText = `
      display: flex;
      justify-content: center;
      margin-bottom: 10px;
      width: 100%;
      flex-wrap: wrap;
      gap: 2px;
      min-height: 50px;
    `;

    // 8 buttons (value + 7 children)
    for (let i = 0; i < 8; i++) {
      const btn = document.createElement('button');
      btn.textContent = '';
      btn.className = 'keyboard-child-button';
      btn.style.cssText = `
        margin: 2px;
        padding: 10px;
        min-width: 40px;
        min-height: 40px;
        font-size: 18px;
        cursor: pointer;
        background: #e0e0e0;
        border: 1px solid #ccc;
        border-radius: 3px;
        opacity: 0.5;
        transition: all 0.2s;
      `;
      btn.dataset.index = i.toString();

      btn.addEventListener('mouseenter', () => {
        if (btn.textContent) btn.style.background = '#339af0';
      });

      btn.addEventListener('mouseleave', () => {
        if (btn.textContent) btn.style.background = '#d3d3d3';
      });

      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);
        const char = this.currentChildren[index];

        if (!char || !this.activeFamily) return;

        if (this.isSameFamily(char)) {
          this.replaceLastCharacter(char);
        } else {
          this.insertCharacter(char);
        }

        this.updateChildButtons(
          this.activeFamily.value,
          this.activeFamily.children
        );
      });

      this.childButtonsContainer.appendChild(btn);
    }

    this.keyboardElement.appendChild(this.childButtonsContainer);
    this.renderKeyboard();

    // Make draggable if enabled
    if (options.draggable !== false) {
      this.makeDraggable();
    }

    // Make resizable with constraints
    this.makeResizable();

    (options.container || document.body).appendChild(this.keyboardElement);

    // Handle inputs setup
    if (options.targetInputs) {
      this.targetInputs = options.targetInputs;
      if (this.targetInputs.length > 0) {
        this.targetInput = this.targetInputs[0];
        this.value = this.targetInput.value;
        this.setupInputListeners();
      }
    } else if (options.targetInput) {
      this.targetInput = options.targetInput;
      this.targetInputs = [this.targetInput];
      this.value = this.targetInput.value;
      this.setupInputListeners();
    } else {
      // No initial input, but still create keyboard
      this.setupGlobalListeners();
    }

    // Always show keyboard initially
    this.keyboardElement.style.opacity = '1';
    this.keyboardElement.style.display = 'flex';
  }

  private setupInputListeners() {
    // Add listeners to all registered inputs
    this.targetInputs.forEach(input => {
      this.addInputListeners(input);
    });

    // Setup global listeners
    this.setupGlobalListeners();
  }

  private addInputListeners(input: HTMLInputElement | HTMLTextAreaElement) {
    // When input gets focus, switch to it
    const focusHandler = () => {
      this.switchToInput(input);
    };

    // Sync keyboard value when input changes
    const inputHandler = () => {
      if (this.targetInput === input) {
        this.value = input.value;
      }
    };

    const changeHandler = () => {
      if (this.targetInput === input) {
        this.value = input.value;
      }
    };

    // Handle cut, copy, paste events
    const cutHandler = () => {
      if (this.targetInput === input) {
        setTimeout(() => {
          this.value = input.value;
        }, 0);
      }
    };

    const pasteHandler = () => {
      if (this.targetInput === input) {
        setTimeout(() => {
          this.value = input.value;
        }, 0);
      }
    };

    // Store handlers on the element for reference
    input.dataset.keyboardFocusHandler = 'true';
    input.dataset.keyboardInputHandler = 'true';
    input.dataset.keyboardChangeHandler = 'true';
    input.dataset.keyboardCutHandler = 'true';
    input.dataset.keyboardPasteHandler = 'true';

    input.addEventListener('focus', focusHandler);
    input.addEventListener('input', inputHandler);
    input.addEventListener('change', changeHandler);
    input.addEventListener('cut', cutHandler);
    input.addEventListener('paste', pasteHandler);
  }

  private setupGlobalListeners() {
    // Optional: Hide keyboard when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!this.keyboardElement.contains(target)) {
        this.keyboardElement.style.opacity = '0.7';
      }
    });
  }

  private createHeader(minimizeButton: boolean = true, closeButton: boolean = false) {
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'keyboard-header';
    this.headerElement.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #2c3e50;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      border-radius: 5px 5px 0 0;
      margin-bottom: 10px;
      user-select: none;
      flex-shrink: 0;
    `;

    const title = document.createElement('span');
    title.textContent = 'Amharic Keyboard';
    title.style.fontWeight = 'bold';

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';

    if (minimizeButton) {
      const minimizeBtn = document.createElement('button');
      minimizeBtn.innerHTML = '−';
      minimizeBtn.style.cssText = `
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      `;
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMinimize();
      });
      controls.appendChild(minimizeBtn);
    }

    if (closeButton) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      `;
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
      controls.appendChild(closeBtn);
    }

    this.headerElement.appendChild(title);
    this.headerElement.appendChild(controls);
    this.keyboardElement.prepend(this.headerElement);
  }

  private makeDraggable() {
    const dragHandle = this.headerElement || this.keyboardElement;

    dragHandle.addEventListener('mousedown', (e) => {
      // Don't start drag if clicking on buttons in header or resize handle
      if ((e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).classList.contains('resize-handle')) {
        return;
      }

      this.isDragging = true;
      const rect = this.keyboardElement.getBoundingClientRect();
      this.originalX = rect.left;
      this.originalY = rect.top;
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;

      document.addEventListener('mousemove', this.handleDragMove);
      document.addEventListener('mouseup', this.handleDragEnd);

      this.keyboardElement.style.cursor = 'grabbing';
      this.keyboardElement.style.transition = 'none';
    });
  }

  private handleDragMove = (e: MouseEvent) => {
    if (!this.isDragging) return;

    e.preventDefault();

    const x = e.clientX - this.dragOffsetX;
    const y = e.clientY - this.dragOffsetY;

    // Keep keyboard within viewport bounds
    const keyboardWidth = this.keyboardElement.offsetWidth;
    const keyboardHeight = this.keyboardElement.offsetHeight;
    const maxX = window.innerWidth - keyboardWidth;
    const maxY = window.innerHeight - keyboardHeight;

    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));

    this.keyboardElement.style.left = `${boundedX}px`;
    this.keyboardElement.style.top = `${boundedY}px`;
    this.keyboardElement.style.bottom = 'auto';
    this.keyboardElement.style.right = 'auto';
  };

  private handleDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);

    this.keyboardElement.style.cursor = '';
    this.keyboardElement.style.transition = 'all 0.3s ease';
  };

  private makeResizable() {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'resize-handle';
    this.resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: se-resize;
      background: linear-gradient(135deg, transparent 50%, #888 50%);
      border-radius: 0 0 5px 0;
      z-index: 10001;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;

    // Show resize handle on hover over keyboard
    this.keyboardElement.addEventListener('mouseenter', () => {
      if (this.resizeHandle) {
        this.resizeHandle.style.opacity = '0.9';
      }
    });

    this.keyboardElement.addEventListener('mouseleave', (e) => {
      // Don't hide if we're currently resizing
      if (!this.isResizing && this.resizeHandle) {
        this.resizeHandle.style.opacity = '0.7';
      }
    });

    this.resizeHandle.addEventListener('mouseenter', () => {
      if (this.resizeHandle) {
        this.resizeHandle.style.opacity = '1';
      }
    });

    this.resizeHandle.addEventListener('mousedown', (e) => {
      this.startResize(e);
      e.preventDefault();
      e.stopPropagation();
    });

    this.keyboardElement.appendChild(this.resizeHandle);

    // Add resize event listeners to document
    document.addEventListener('mousemove', this.handleResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  private startResize = (e: MouseEvent) => {
    this.isResizing = true;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartWidth = this.keyboardElement.offsetWidth;
    this.resizeStartHeight = this.keyboardElement.offsetHeight;

    this.keyboardElement.style.transition = 'none';
    this.keyboardElement.style.cursor = 'se-resize';
  };

  private handleResize = (e: MouseEvent) => {
    if (!this.isResizing) return;

    e.preventDefault();

    // Calculate new dimensions
    const deltaX = e.clientX - this.resizeStartX;
    const deltaY = e.clientY - this.resizeStartY;

    let newWidth = this.resizeStartWidth + deltaX;
    let newHeight = this.resizeStartHeight + deltaY;

    // Apply constraints
    newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));
    newHeight = Math.max(this.minHeight, Math.min(newHeight, this.maxHeight));

    // Apply constraints based on viewport
    const maxViewportWidth = window.innerWidth * 0.9;
    const maxViewportHeight = window.innerHeight * 0.9;
    newWidth = Math.min(newWidth, maxViewportWidth);
    newHeight = Math.min(newHeight, maxViewportHeight);

    // Update keyboard size
    this.keyboardElement.style.width = `${newWidth}px`;
    this.keyboardElement.style.height = `${newHeight}px`;

    // Ensure keyboard stays within viewport
    const rect = this.keyboardElement.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      const newLeft = window.innerWidth - newWidth;
      this.keyboardElement.style.left = `${Math.max(0, newLeft)}px`;
    }

    if (rect.bottom > window.innerHeight) {
      const newTop = window.innerHeight - newHeight;
      this.keyboardElement.style.top = `${Math.max(0, newTop)}px`;
    }

    // Dispatch resize event for any external listeners
    this.keyboardElement.dispatchEvent(new CustomEvent('keyboard-resize', {
      detail: { width: newWidth, height: newHeight }
    }));
  };

  private stopResize = () => {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.keyboardElement.style.cursor = '';
    this.keyboardElement.style.transition = 'all 0.3s ease';

    if (this.resizeHandle) {
      this.resizeHandle.style.opacity = '0.7';
    }
  };

  private toggleMinimize() {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      // Store current position and size
      const rect = this.keyboardElement.getBoundingClientRect();

      // Create minimized version
      this.minimizedElement = document.createElement('div');
      this.minimizedElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #2c3e50;
        color: white;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        overflow: hidden;
        padding: 0;
        font-size: 24px;
        user-select: none;
        transition: all 0.3s ease;
      `;

      this.minimizedElement.innerHTML = '⌨';
      this.minimizedElement.title = 'Click to restore Amharic Keyboard';

      this.minimizedElement.addEventListener('mouseenter', () => {
        this.minimizedElement!.style.transform = 'scale(1.1)';
        this.minimizedElement!.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
      });

      this.minimizedElement.addEventListener('mouseleave', () => {
        this.minimizedElement!.style.transform = 'scale(1)';
        this.minimizedElement!.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      });

      this.minimizedElement.addEventListener('click', () => {
        this.toggleMinimize();
      });

      // Make minimized icon draggable
      this.minimizedElement.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.startDragMinimized(e);
      });

      this.keyboardElement.style.display = 'none';
      document.body.appendChild(this.minimizedElement);
    } else {
      this.keyboardElement.style.display = 'flex';
      if (this.minimizedElement) {
        this.minimizedElement.remove();
        this.minimizedElement = null;
      }
    }
  }

  private startDragMinimized(e: MouseEvent) {
    const minimized = this.minimizedElement!;
    let offsetX = e.clientX - minimized.offsetLeft;
    let offsetY = e.clientY - minimized.offsetTop;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - offsetX;
      const y = moveEvent.clientY - offsetY;

      const maxX = window.innerWidth - minimized.offsetWidth;
      const maxY = window.innerHeight - minimized.offsetHeight;

      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));

      minimized.style.left = `${boundedX}px`;
      minimized.style.top = `${boundedY}px`;
      minimized.style.right = 'auto';
      minimized.style.bottom = 'auto';
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  public show() {
    this.keyboardElement.style.display = 'flex';
    if (this.minimizedElement) {
      this.minimizedElement.remove();
      this.minimizedElement = null;
    }
    this.isMinimized = false;
  }

  public hide() {
    this.keyboardElement.style.display = 'none';
  }

  public moveTo(x: number, y: number) {
    this.keyboardElement.style.left = `${x}px`;
    this.keyboardElement.style.top = `${y}px`;
    this.keyboardElement.style.bottom = 'auto';
    this.keyboardElement.style.right = 'auto';
  }

  public resize(width: number, height: number) {
    // Apply constraints
    const newWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
    const newHeight = Math.max(this.minHeight, Math.min(height, this.maxHeight));

    this.keyboardElement.style.width = `${newWidth}px`;
    this.keyboardElement.style.height = `${newHeight}px`;
  }

  // ------------------------------
  // RENDER MAIN KEYBOARD
  // ------------------------------
  private renderKeyboard() {
    const rows = Array.from(this.keyboardElement.children).filter(
      c => c !== this.childButtonsContainer &&
        c !== this.headerElement &&
        c !== this.resizeHandle &&
        !c.classList?.contains('keyboard-header')
    );
    rows.forEach(r => r.remove());

    this.layout.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';
      rowEl.style.cssText = `
        display: flex;
        justify-content: center;
        margin-bottom: 5px;
        width: 100%;
        flex-wrap: nowrap;
        flex-shrink: 0;
      `;

      row.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'keyboard-key';
        btn.textContent = key.label;
        btn.style.cssText = `
          margin: 2px;
          padding: 8px;
          min-width: 35px;
          min-height: 40px;
          font-size: clamp(14px, 1.5vw, 18px);
          cursor: pointer;
          border: 1px solid #ccc;
          border-radius: 3px;
          background: white;
          transition: all 0.2s;
          flex: 1;
          max-width: ${key.type === 'space' ? '150px' : '70px'};
          box-sizing: border-box;
        `;

        btn.addEventListener('mouseenter', () => {
          if (key.type === 'char') {
            btn.style.background = '#339af0';
            btn.style.color = 'white';
          }
        });

        btn.addEventListener('mouseleave', () => {
          if (key.type === 'char') {
            btn.style.background = 'white';
            btn.style.color = 'black';
          }
        });

        btn.addEventListener('click', () => this.handleKeyPress(key));
        rowEl.appendChild(btn);
      });

      this.keyboardElement.appendChild(rowEl);
    });
  }

  // ------------------------------
  // CHILD ROW RENDER
  // ------------------------------
  private updateChildButtons(value: string, children: string[]) {
    const items = [value, ...children];
    this.currentChildren = items;

    const buttons = this.childButtonsContainer.children;

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i] as HTMLButtonElement;

      if (i < items.length) {
        btn.textContent = items[i];
        btn.style.background = '#d3d3d3';
        btn.style.opacity = '1';
        btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      } else {
        btn.textContent = '';
        btn.style.background = '#e0e0e0';
        btn.style.opacity = '0.5';
        btn.style.border = '1px solid #ccc';
        btn.style.boxShadow = 'none';
      }
    }
  }

  // ------------------------------
  // INSERT / REPLACE LOGIC
  // ------------------------------
  private insertCharacter(char: string) {
    this.value += char;
    this.syncInput();
  }

  private replaceLastCharacter(char: string) {
    this.value = this.value.slice(0, -1) + char;
    this.syncInput();
  }

  private syncInput() {
    if (this.targetInput) {
      // Update the input field with keyboard value
      this.targetInput.value = this.value;
      this.targetInput.focus();
      this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Also ensure keyboard state stays in sync
      this.value = this.targetInput.value;
    }
  }

  private isSameFamily(char: string): boolean {
    return !!this.activeFamily &&
      [this.activeFamily.value, ...this.activeFamily.children].includes(char);
  }

  // ------------------------------
  // KEY HANDLER
  // ------------------------------
  private handleKeyPress(key: any) {
    if (!this.targetInput) {
      // If no input is selected, don't do anything
      return;
    }

    if (key.type === 'char' && key.children?.length) {
      // switch active family
      this.activeFamily = { value: key.value, children: key.children };

      // insert parent
      this.insertCharacter(key.value);

      // show family
      this.updateChildButtons(key.value, key.children);
      return;
    }

    // non-family char → reset family
    this.activeFamily = null;
    this.currentChildren = [];
    this.childButtonsContainer
      .querySelectorAll('button')
      .forEach(b => {
        b.textContent = '';
        b.style.background = '#e0e0e0';
        b.style.opacity = '0.5';
        b.style.border = '1px solid #ccc';
        b.style.boxShadow = 'none';
      });

    if (key.type === 'char' || key.type === 'point') this.insertCharacter(key.value || '');
    if (key.type === 'space') this.insertCharacter(' ');
    if (key.type === 'enter') this.insertCharacter('\n');
    if (key.type === 'backspace') {
      this.value = this.value.slice(0, -1);
      this.syncInput();
    }
  }

  // ------------------------------
  // INPUT MANAGEMENT METHODS
  // ------------------------------
  public switchToInput(input: HTMLInputElement | HTMLTextAreaElement) {
    if (this.targetInput !== input) {
      this.targetInput = input;
      this.value = input.value;
      this.keyboardElement.style.opacity = '1';

      // Reset active family when switching inputs
      this.activeFamily = null;
      this.currentChildren = [];
      this.childButtonsContainer
        .querySelectorAll('button')
        .forEach(b => {
          b.textContent = '';
          b.style.background = '#e0e0e0';
          b.style.opacity = '0.5';
          b.style.border = '1px solid #ccc';
          b.style.boxShadow = 'none';
        });

      return true;
    }
    return false;
  }

  public addInput(input: HTMLInputElement | HTMLTextAreaElement) {
    if (!this.targetInputs.includes(input)) {
      this.targetInputs.push(input);
      this.addInputListeners(input);

      // If no current input is selected, use this one
      if (!this.targetInput) {
        this.targetInput = input;
        this.value = input.value;
      }
      return true;
    }
    return false;
  }

  public removeInput(input: HTMLInputElement | HTMLTextAreaElement) {
    const index = this.targetInputs.indexOf(input);
    if (index > -1) {
      this.targetInputs.splice(index, 1);

      // Remove data attributes
      delete input.dataset.keyboardFocusHandler;
      delete input.dataset.keyboardInputHandler;
      delete input.dataset.keyboardChangeHandler;
      delete input.dataset.keyboardCutHandler;
      delete input.dataset.keyboardPasteHandler;

      // If we removed the current target, switch to another
      if (this.targetInput === input) {
        this.targetInput = this.targetInputs[0] || null;
        this.value = this.targetInput?.value || '';
      }
      return true;
    }
    return false;
  }

  public getCurrentInput(): HTMLInputElement | HTMLTextAreaElement | null {
    return this.targetInput;
  }

  public getAllInputs(): (HTMLInputElement | HTMLTextAreaElement)[] {
    return [...this.targetInputs];
  }

  public getValue() {
    return this.value;
  }

  public destroy() {
    // Remove event listeners from all inputs
    this.targetInputs.forEach(input => {
      delete input.dataset.keyboardFocusHandler;
      delete input.dataset.keyboardInputHandler;
      delete input.dataset.keyboardChangeHandler;
      delete input.dataset.keyboardCutHandler;
      delete input.dataset.keyboardPasteHandler;
    });

    // Remove event listeners
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.stopResize);
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);

    // Remove elements
    this.keyboardElement.remove();
    if (this.minimizedElement) {
      this.minimizedElement.remove();
    }
  }
}
