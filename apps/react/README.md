# @amharic-virtual-keyboard/react

A powerful, customizable, and draggable Amharic virtual keyboard component for React applications.

## Features

- ⌨️ **Full Amharic Support**: Support for all Amharic characters and families.
- 🖱️ **Draggable & Resizable**: Users can move and resize the keyboard freely.
- 📱 **Responsive**: Works well across different screen sizes.
- 🔄 **Multi-input Support**: Easily attach the keyboard to one or multiple input fields.
- 🪝 **Custom Hook**: Includes `useAmharicKeyboard` for easy programmatic control.
- 🎨 **Customizable**: Built with Vanilla CSS, easy to style.

## Installation

```bash
npm install @amharic-virtual-keyboard/react
# or
yarn add @amharic-virtual-keyboard/react
# or
pnpm add @amharic-virtual-keyboard/react
```

## Quick Start

1. **Import the component and styles**:

```tsx
import { AmharicKeyboard } from '@amharic-virtual-keyboard/react';
import '@amharic-virtual-keyboard/react/dist/react.css';

function App() {
  const [target, setTarget] = useState<HTMLInputElement | null>(null);

  return (
    <div>
      <input 
        type="text" 
        ref={(el) => setTarget(el)} 
        placeholder="Type here..." 
      />
      <AmharicKeyboard targetInput={target} />
    </div>
  );
}
```

## Props

The `AmharicKeyboard` component accepts the following props:

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `targetInput` | `HTMLInputElement \| HTMLTextAreaElement` | - | A single input or textarea element to attach the keyboard to. |
| `targetInputs` | `(HTMLInputElement \| HTMLTextAreaElement)[]` | - | An array of input or textarea elements. The keyboard will automatically switch context to the focused input. |
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
| `style` | `React.CSSProperties` | `{}` | Inline styles for the keyboard container. |

## Programmatic Control with `useAmharicKeyboard`

The `useAmharicKeyboard` hook provides methods to control the keyboard programmatically.

```tsx
import { AmharicKeyboard, useAmharicKeyboard } from '@amharic-virtual-keyboard/react';

function CustomApp() {
  const { 
    keyboardRef, 
    showKeyboard, 
    hideKeyboard, 
    addInput 
  } = useAmharicKeyboard();

  return (
    <>
      <button onClick={showKeyboard}>Open Keyboard</button>
      <input ref={(el) => el && addInput(el)} />
      <AmharicKeyboard ref={keyboardRef} />
    </>
  );
}
```

### Available Methods

- `addInput(input)`: Adds a new input field to the keyboard's target list.
- `removeInput(input)`: Removes an input field from the target list.
- `switchToInput(input)`: Manually switches the keyboard focus to a specific input.
- `showKeyboard()`: Shows the keyboard.
- `hideKeyboard()`: Hides the keyboard.
- `minimizeKeyboard()`: Minimizes the keyboard to a small icon.
- `restoreKeyboard()`: Restores the keyboard from its minimized state.
- `moveKeyboard(x, y)`: Moves the keyboard to specific coordinates.
- `resizeKeyboard(width, height)`: Resizes the keyboard.
- `getValue()`: Gets the current value from the active input field.

## Styling

The keyboard uses CSS variables that you can override to match your theme. Make sure to import the CSS file in your application root:

```tsx
import '@amharic-virtual-keyboard/react/dist/react.css';
```

## License

MIT © [amuif](https://github.com/amuif)
