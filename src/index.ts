import { amharicLayout } from "./layouts/amharic";
import { KeyboardLayout, } from "./types/keyboard";

interface AmharicKeyboardOptions {
  targetInput: HTMLInputElement | HTMLTextAreaElement;
  layout?: KeyboardLayout;
  container?: HTMLElement;
}

export class AmharicKeyboard {
  private value: string = '';
  private shiftActive: boolean = false;
  private layout: KeyboardLayout;
  private keyboardElement: HTMLElement;
  private targetInput: HTMLInputElement | HTMLTextAreaElement;
  private childButtonsContainer: HTMLElement;
  private currentChildren: string[] = [];

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

    this.childButtonsContainer = document.createElement('div');
    this.childButtonsContainer.style.display = 'flex';
    this.childButtonsContainer.style.justifyContent = 'center';
    this.childButtonsContainer.style.marginBottom = '10px';
    this.childButtonsContainer.style.width = '100%';

    for (let i = 0; i < 7; i++) {
      const childButton = document.createElement('button');
      childButton.textContent = '';
      childButton.style.margin = '2px';
      childButton.style.padding = '10px';
      childButton.style.minWidth = '40px';
      childButton.style.minHeight = '40px';
      childButton.style.fontSize = '18px';
      childButton.style.cursor = 'pointer';
      childButton.style.background = '#e0e0e0';
      childButton.style.border = '1px solid #ccc';
      childButton.style.borderRadius = '3px';
      childButton.style.opacity = '0.5';
      childButton.dataset.index = i.toString();

      childButton.addEventListener('click', (e) => {
        const button = e.target as HTMLButtonElement;
        const index = parseInt(button.dataset.index || '0');
        if (this.currentChildren[index]) {
          this.insertCharacter(this.currentChildren[index]);
          // this.clearChildButtons();
        }
      });

      this.childButtonsContainer.appendChild(childButton);
    }

    this.keyboardElement.appendChild(this.childButtonsContainer);
    this.renderKeyboard();

    const container = options.container || document.body;
    container.appendChild(this.keyboardElement);

    this.value = this.targetInput.value;
  }

  private renderKeyboard() {
    const existingRows = Array.from(this.keyboardElement.children).filter(
      child => child !== this.childButtonsContainer
    );
    existingRows.forEach(row => row.remove());

    this.layout.forEach((row) => {
      const rowElement = document.createElement('div');
      rowElement.style.display = 'flex';
      rowElement.style.justifyContent = 'center';
      rowElement.style.marginBottom = '5px';

      row.forEach((key) => {
        const button = document.createElement('button');
        button.textContent = key.label;
        button.style.margin = '2px';
        button.style.padding = '10px';
        button.style.minWidth = '40px';
        button.style.minHeight = '40px';
        button.style.fontSize = '18px';
        button.style.cursor = 'pointer';
        button.style.background = '#fff';
        button.style.border = '1px solid #ccc';
        button.style.borderRadius = '3px';
        button.style.transition = 'all 0.2s';

        if (key.type === 'shift' && this.shiftActive) {
          button.style.backgroundColor = '#4dabf7';
          button.style.color = 'white';
        } else if (key.type === 'backspace') {
          button.style.backgroundColor = '#ff6b6b';
          button.style.color = 'white';
        } else if (key.type === 'enter') {
          button.style.backgroundColor = '#51cf66';
          button.style.color = 'white';
        } else if (key.type === 'space') {
          button.style.backgroundColor = '#ced4da';
        }

        button.addEventListener('click', () => this.handleKeyPress(key));
        button.addEventListener('mousedown', () => {
          button.style.transform = 'scale(0.95)';
        });
        button.addEventListener('mouseup', () => {
          button.style.transform = 'scale(1)';
        });
        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
        });

        rowElement.appendChild(button);
      });

      this.keyboardElement.appendChild(rowElement);
    });
  }

  private updateChildButtons(children: string[]) {
    this.currentChildren = children;
    const childButtons = this.childButtonsContainer.children;

    for (let i = 0; i < childButtons.length; i++) {
      const button = childButtons[i] as HTMLButtonElement;
      if (i < children.length) {
        button.textContent = children[i];
        button.style.background = '#a5d8ff';
        button.style.opacity = '1';
        button.style.border = '2px solid #339af0';
      } else {
        button.textContent = '';
        button.style.background = '#e0e0e0';
        button.style.opacity = '0.5';
        button.style.border = '1px solid #ccc';
      }
    }
  }

  private clearChildButtons() {
    this.currentChildren = [];
    const childButtons = this.childButtonsContainer.children;

    for (let i = 0; i < childButtons.length; i++) {
      const button = childButtons[i] as HTMLButtonElement;
      button.textContent = '';
      button.style.background = '#e0e0e0';
      button.style.opacity = '0.5';
      button.style.border = '1px solid #ccc';
    }
  }

  private insertCharacter(char: string) {
    this.value += char;
    this.targetInput.value = this.value;
    this.targetInput.focus();
    this.targetInput.dispatchEvent(new Event('input'));
  }

  private handleKeyPress(key: any) {
    switch (key.type) {
      case 'char':
        if (key.children && key.children.length > 0) {
          this.updateChildButtons(key.children);
        } else {
          this.insertCharacter(key.value || '');
          // this.clearChildButtons();
        }
        break;
      case 'space':
        this.insertCharacter(key.value || ' ');
        // this.clearChildButtons();
        break;
      case 'backspace':
        this.value = this.value.slice(0, -1);
        this.targetInput.value = this.value;
        this.targetInput.focus();
        this.targetInput.dispatchEvent(new Event('input'));
        // this.clearChildButtons();
        break;
      case 'enter':
        this.insertCharacter('\n');
        // this.clearChildButtons();
        break;
      case 'shift':
        this.shiftActive = !this.shiftActive;
        // In a real implementation, you might want to switch to a different layout
        // or modify the current layout based on shift state
        this.renderKeyboard();
        this.clearChildButtons();
        break;
    }
  }

  public destroy() {
    this.keyboardElement.remove();
  }

  public setValue(value: string) {
    this.value = value;
    this.targetInput.value = value;
  }

  public getValue(): string {
    return this.value;
  }
}
