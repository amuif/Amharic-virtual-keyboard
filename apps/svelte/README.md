# @amharic-virtual-keyboard/svelte

A powerful, customizable, and draggable Amharic virtual keyboard component for Svelte applications (Svelte 5 ready).

## Features

- ⌨️ **Full Amharic Support**: Support for all Amharic characters and families.
- 🖱️ **Draggable & Resizable**: Users can move and resize the keyboard freely.
- 📱 **Responsive**: Works well across different screen sizes.
- 🔄 **Multi-input Support**: Easily attach the keyboard to one or multiple input fields.
- 🚀 **Svelte 5 Optimized**: Built using Svelte 5 runes for high performance.
- 🎨 **Customizable**: Easy to style with Vanilla CSS.

## Installation

```bash
npm install @amharic-virtual-keyboard/svelte
# or
yarn add @amharic-virtual-keyboard/svelte
# or
pnpm add @amharic-virtual-keyboard/svelte
```

## Quick Start

1. **Import the component and styles**:

```svelte
<script>
  import { AmharicKeyboard } from '@amharic-virtual-keyboard/svelte';
  import '@amharic-virtual-keyboard/svelte/dist/svelte.css';

  let targetInput = $state();
</script>

<input 
  type="text" 
  bind:this={targetInput} 
  placeholder="Type here..." 
/>

<AmharicKeyboard {targetInput} />
```

## Props

The `AmharicKeyboard` component accepts the following props:

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `targetInput` | `HTMLInputElement \| HTMLTextAreaElement` | - | A single input element to attach the keyboard to. |
| `targetInputs` | `(HTMLInputElement \| HTMLTextAreaElement)[]` | - | An array of input elements. The keyboard syncs with the focused input. |
| `visible` | `boolean` | `true` | Whether the keyboard is initially visible. |
| `layout` | `KeyboardLayout` | `amharicLayout` | Custom keyboard layout from `@amharic-keyboard/core`. |
| `draggable` | `boolean` | `true` | Whether the keyboard can be dragged. |
| `showHeader` | `boolean` | `true` | Whether to show the header/drag handle. |
| `minimizeButton` | `boolean` | `true` | Whether to show the minimize button. |
| `closeButton` | `boolean` | `false` | Whether to show a close button. |
| `minWidth` | `number` | `300` | Minimum width of the keyboard. |
| `minHeight` | `number` | `200` | Minimum height of the keyboard. |
| `maxWidth` | `number` | `800` | Maximum width of the keyboard. |
| `maxHeight` | `number` | `350` | Maximum height of the keyboard. |
| `onClose` | `() => void` | - | Callback function when the keyboard is closed. |
| `className` | `string` | `""` | Additional CSS class for the keyboard container. |
| `style` | `string` | `""` | Inline styles for the keyboard container. |

## Programmatic Control

In Svelte 5, you can access the keyboard's API methods by binding to the component instance.

```svelte
<script>
  import { AmharicKeyboard } from '@amharic-virtual-keyboard/svelte';
  
  let keyboard;
  let myInput;

  function handleOpen() {
    keyboard.show();
  }

  function handleAddInput() {
    keyboard.addInput(myInput);
  }
</script>

<button onclick={handleOpen}>Open Keyboard</button>
<input bind:this={myInput} />

<AmharicKeyboard bind:this={keyboard} />
```

### Available Methods

- `addInput(input)`: Adds a new input field to the target list.
- `removeInput(input)`: Removes an input field.
- `switchToInput(input)`: Switches focus to a specific input.
- `show()`: Makes the keyboard visible.
- `hide()`: Hides the keyboard.
- `toggleMinimize()`: Toggles the minimized state.
- `moveTo(x, y)`: Moves the keyboard.
- `resize(width, height)`: Resizes the keyboard.
- `syncInput()`: Synchronizes the internal value with the current input's value.
- `getValue()`: Returns the current typed value.

## Styling

Override the default styles by providing a `className` or custom `style` prop. Make sure to import the CSS file:

```javascript
import '@amharic-virtual-keyboard/svelte/dist/svelte.css';
```

## License

MIT © [amuif](https://github.com/amuif)
