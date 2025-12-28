import { amharicLayout } from "../../layouts/amharic";
import { KeyboardLayout } from "../../types/keyboard";

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

  constructor(options: AmharicKeyboardOptions) {
    this.targetInput = options.targetInput;
    this.layout = options.layout || amharicLayout;
    this.keyboardElement = document.createElement('div');
    this.keyboardElement.style.display = 'flex';
    this.keyboardElement.style.flexDirection = 'column';
    this.keyboardElement.style.alignItems = 'center';

    this.renderKeyboard();

    const container = options.container || document.body;
    container.appendChild(this.keyboardElement);

    this.value = this.targetInput.value;
  }

  private renderKeyboard() {
    this.keyboardElement.innerHTML = '';

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
        button.style.fontSize = '18px';
        button.style.cursor = 'pointer';

        if (key.type === 'shift' && this.shiftActive) {
          button.style.backgroundColor = 'lightblue';
        }

        button.addEventListener('click', () => this.handleKeyPress(key));
        rowElement.appendChild(button);
      });

      this.keyboardElement.appendChild(rowElement);
    });
  }

  private handleKeyPress(key: { type: KeyType; value?: string }) {
    let newValue = this.value;
    switch (key.type) {
      case 'char':
      case 'space':
        newValue += key.value || ' ';
        break;
      case 'backspace':
        newValue = newValue.slice(0, -1);
        break;
      case 'enter':
        newValue += '\n';
        break;
      case 'shift':
        this.shiftActive = !this.shiftActive;
        this.renderKeyboard();
        return;
    }
    this.value = newValue;
    this.targetInput.value = newValue;
    this.targetInput.dispatchEvent(new Event('input'));
  }

  public destroy() {
    this.keyboardElement.remove();
  }
}
