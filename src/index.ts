import { amharicLayout } from "./layouts/amharic";
import { KeyboardLayout } from "./types/keyboard";

interface AmharicKeyboardOptions {
  targetInput: HTMLInputElement | HTMLTextAreaElement;
  layout?: KeyboardLayout;
  container?: HTMLElement;
}

export class AmharicKeyboard {
  private value: string = '';
  private layout: KeyboardLayout;
  private keyboardElement: HTMLElement;
  private targetInput: HTMLInputElement | HTMLTextAreaElement;
  private childButtonsContainer: HTMLElement;

  private currentChildren: string[] = [];
  private activeFamily: { value: string; children: string[] } | null = null;

  constructor(options: AmharicKeyboardOptions) {
    this.targetInput = options.targetInput;
    this.layout = options.layout || amharicLayout;

    this.keyboardElement = document.createElement('div');
    this.keyboardElement.style.display = 'flex';
    this.keyboardElement.style.flexDirection = 'column';
    this.keyboardElement.style.alignItems = 'center';
    this.keyboardElement.style.padding = '10px';
    this.keyboardElement.style.background = '#f0f0f0';
    this.keyboardElement.style.border = '1px solid #ccc';
    this.keyboardElement.style.borderRadius = '5px';

    // CHILD ROW
    this.childButtonsContainer = document.createElement('div');
    this.childButtonsContainer.style.display = 'flex';
    this.childButtonsContainer.style.justifyContent = 'center';
    this.childButtonsContainer.style.marginBottom = '10px';
    this.childButtonsContainer.style.width = '100%';

    // 8 buttons (value + 7 children)
    for (let i = 0; i < 8; i++) {
      const btn = document.createElement('button');
      btn.textContent = '';
      btn.style.margin = '2px';
      btn.style.padding = '10px';
      btn.style.minWidth = '40px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '18px';
      btn.style.cursor = 'pointer';
      btn.style.background = '#e0e0e0';
      btn.style.border = '1px solid #ccc';
      btn.style.borderRadius = '3px';
      btn.style.opacity = '0.5';
      btn.dataset.index = i.toString();

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

    (options.container || document.body).appendChild(this.keyboardElement);
    this.value = this.targetInput.value;
  }

  // ------------------------------
  // RENDER MAIN KEYBOARD
  // ------------------------------
  private renderKeyboard() {
    const rows = Array.from(this.keyboardElement.children).filter(
      c => c !== this.childButtonsContainer
    );
    rows.forEach(r => r.remove());

    this.layout.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.style.display = 'flex';
      rowEl.style.justifyContent = 'center';
      rowEl.style.marginBottom = '5px';

      row.forEach(key => {
        const btn = document.createElement('button');
        btn.textContent = key.label;
        btn.style.margin = '2px';
        btn.style.padding = '10px';
        btn.style.minWidth = '40px';
        btn.style.minHeight = '40px';
        btn.style.fontSize = '18px';
        btn.style.cursor = 'pointer';
        btn.style.border = '1px solid #ccc';
        btn.style.borderRadius = '3px';

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
        btn.style.background = '#a5d8ff';
        btn.style.opacity = '1';
        btn.style.border = '2px solid #339af0';
      } else {
        btn.textContent = '';
        btn.style.background = '#e0e0e0';
        btn.style.opacity = '0.5';
        btn.style.border = '1px solid #ccc';
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
    this.targetInput.value = this.value;
    this.targetInput.focus();
    this.targetInput.dispatchEvent(new Event('input'));
  }

  private isSameFamily(char: string): boolean {
    return !!this.activeFamily &&
      [this.activeFamily.value, ...this.activeFamily.children].includes(char);
  }

  // ------------------------------
  // KEY HANDLER
  // ------------------------------
  private handleKeyPress(key: any) {
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
      .forEach(b => (b.textContent = ''));

    if (key.type === 'char') this.insertCharacter(key.value || '');
    if (key.type === 'space') this.insertCharacter(' ');
    if (key.type === 'enter') this.insertCharacter('\n');
    if (key.type === 'backspace') {
      this.value = this.value.slice(0, -1);
      this.syncInput();
    }
  }

  public getValue() {
    return this.value;
  }

  public destroy() {
    this.keyboardElement.remove();
  }
}

