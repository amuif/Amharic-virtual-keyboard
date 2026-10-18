# @amharic-virtual-keyboard/react

A customizable Amharic (Ge'ez / Ethiopic) virtual keyboard component for React: floating or inline, themeable, accessible, and drivable by AI agents.

## Features

- ⌨️ **Full Amharic support**: every character family, plus numbers and Ethiopic punctuation.
- ✍️ **Types at the caret**: inserts and deletes where the cursor is, and replaces selections.
- 🪟 **Floating or inline**: a draggable, resizable window, or a keyboard rendered in your layout.
- 📱 **Responsive and touch-ready**: pointer-event drag/resize; docks to the bottom on small screens.
- 🎨 **Themeable**: light, dark or auto themes, all colors and sizes as CSS variables.
- 🎛️ **Controlled mode**: `value` / `onChange` for React state and form libraries.
- 🧩 **Custom rendering**: replace keys, family keys or the header with your own components.
- ♿ **Accessible**: labelled controls, visible focus states, reduced-motion support.
- 🤖 **Agent integration**: a programmatic API, JSON-schema tool definitions for LLMs, and an optional `window` bridge for browser automation.

## Installation

```bash
npm install @amharic-virtual-keyboard/react
# or
pnpm add @amharic-virtual-keyboard/react
```

Import the styles once in your app:

```tsx
import '@amharic-virtual-keyboard/react/dist/react.css';
```

## Quick start

```tsx
import { useState } from 'react';
import { AmharicKeyboard } from '@amharic-virtual-keyboard/react';
import '@amharic-virtual-keyboard/react/dist/react.css';

function App() {
  const [target, setTarget] = useState<HTMLInputElement | null>(null);

  return (
    <>
      <input ref={setTarget} placeholder="Type here..." />
      <AmharicKeyboard targetInput={target} />
    </>
  );
}
```

With no `targetInput`, the keyboard types into the last text input or textarea the user focused.

## Controlled mode

Pass `value` and `onChange` to keep the text in React state. No DOM ref needed:

```tsx
const [text, setText] = useState('');

<input value={text} onChange={(e) => setText(e.target.value)} />
<AmharicKeyboard mode="inline" value={text} onChange={setText} />
```

Without `value`, `onChange` still reports every edit, and `defaultValue` seeds an internal buffer when no input is attached.

## Inline mode

```tsx
<AmharicKeyboard mode="inline" showHeader={false} targetInput={target} />
```

Inline keyboards render in the normal page flow at full width, without drag or resize handles.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `targetInput` | `HTMLInputElement \| HTMLTextAreaElement \| null` | - | Input to type into. |
| `targetInputs` | `(HTMLInputElement \| HTMLTextAreaElement)[]` | - | Several inputs; the focused one receives keys. |
| `value` | `string` | - | Controlled value. Edits are reported through `onChange`. |
| `defaultValue` | `string` | `""` | Initial internal value when no input is attached. |
| `onChange` | `(value: string) => void` | - | Called with the new value after every edit. |
| `mode` | `"floating" \| "inline"` | `"floating"` | Draggable window, or rendered in place. |
| `theme` | `"light" \| "dark" \| "auto"` | `"light"` | `auto` follows the OS color scheme. |
| `title` | `ReactNode` | `"Amharic Keyboard"` | Header title. |
| `layout` | `KeyboardLayout` | `amharicLayout` | Custom key layout. |
| `draggable` | `boolean` | `true` | Allow dragging (floating mode). |
| `resizable` | `boolean` | `true` | Show the resize handle (floating mode). |
| `showHeader` | `boolean` | `true` | Show the header / drag handle. |
| `minimizeButton` | `boolean` | `true` | Show the minimize button. |
| `closeButton` | `boolean` | `false` | Show the close button. |
| `defaultVisible` | `boolean` | `true` | Start visible. |
| `defaultMinimized` | `boolean` | `false` | Start minimized. |
| `defaultPosition` | `{ x, y }` | `{ x: 20, y: 20 }` | Initial floating position. |
| `minWidth` / `maxWidth` | `number` | `350` / `800` | Width limits for resizing. |
| `minHeight` / `maxHeight` | `number` | `300` / `400` | Height limits for resizing. |
| `compactBreakpoint` | `number` | `640` | Below this viewport width a floating keyboard docks to the bottom. |
| `refocusInput` | `boolean` | `true` | Return focus to the input after a key press (skipped on touch so the OS keyboard stays closed). |
| `onKeyPress` | `(key) => boolean \| void` | - | Called before a key is applied. Return `false` to cancel it. |
| `onEnter` | `(input) => void` | - | Enter on a single-line input (textareas get a newline). |
| `onShow` / `onHide` | `() => void` | - | Visibility changes. |
| `onMinimizeChange` | `(minimized: boolean) => void` | - | Minimize / restore. |
| `onClose` | `() => void` | - | The close button was pressed. |
| `renderKey` | `(key, props) => ReactNode` | - | Custom key rendering. |
| `renderFamilyKey` | `(char, props) => ReactNode` | - | Custom family-row key rendering. |
| `renderHeader` | `(props) => ReactNode` | - | Custom header. |
| `exposeAs` | `string` | - | Registers the agent bridge on `window[exposeAs]`. |
| `className` | `string` | `""` | Extra class on the keyboard. |
| `classNames` | `{ root, header, familyRow, familyKey, row, key, minimized, resizeHandle }` | - | Extra classes per part. |
| `style` | `CSSProperties` | - | Inline styles for the keyboard. |

## Theming

Every color and size is a CSS variable. Override them on the keyboard element, e.g. through `className`:

```css
.my-keyboard {
  --avk-accent: #e8590c;
  --avk-key-radius: 4px;
  --avk-key-font-size: 20px;
}
```

| Variable | Purpose |
| :--- | :--- |
| `--avk-bg`, `--avk-fg`, `--avk-muted`, `--avk-border` | Panel colors |
| `--avk-key-bg`, `--avk-key-fg`, `--avk-key-border`, `--avk-key-hover`, `--avk-key-active`, `--avk-special-bg` | Key colors |
| `--avk-accent`, `--avk-accent-fg`, `--avk-accent-soft`, `--avk-focus` | Accent, active family and focus ring |
| `--avk-radius`, `--avk-key-radius`, `--avk-gap`, `--avk-padding` | Shape and spacing |
| `--avk-font`, `--avk-key-font-size`, `--avk-key-min-height` | Typography and key size |
| `--avk-shadow`, `--avk-z-index` | Floating window |

## Custom rendering

Render props receive a `press` function and a `renderDefault` fallback:

```tsx
<AmharicKeyboard
  targetInput={target}
  renderKey={(key, { press, renderDefault }) =>
    key.type === 'enter' ? <button onClick={press}>Send</button> : renderDefault()
  }
  renderHeader={({ title, minimize, dragHandleProps }) => (
    <div {...dragHandleProps} className="my-header">
      {title} <button onClick={minimize}>_</button>
    </div>
  )}
/>
```

## Programmatic control

Use the `useAmharicKeyboard` hook. Inputs added through it stay connected even when the keyboard is unmounted and mounted again:

```tsx
import { AmharicKeyboard, useAmharicKeyboard } from '@amharic-virtual-keyboard/react';

function Form() {
  const { keyboardRef, addInput, showKeyboard, typeText } = useAmharicKeyboard();

  return (
    <>
      <input ref={(el) => el && addInput(el)} />
      <button onClick={() => typeText('ሰላም')}>Insert greeting</button>
      <AmharicKeyboard ref={keyboardRef} />
    </>
  );
}
```

Ref / hook methods:

| Method | Description |
| :--- | :--- |
| `addInput(el)`, `removeInput(el)`, `switchToInput(el)` | Manage target inputs. |
| `getCurrentInput()`, `getAllInputs()` | Inspect target inputs. |
| `show()`, `hide()`, `setMinimized(bool)`, `toggleMinimize()` | Visibility. The hook also has `minimizeKeyboard()` / `restoreKeyboard()`. |
| `moveTo(x, y)`, `resize(w, h)` | Position and size. |
| `typeText(text)` | Insert any text at the caret. |
| `pressKey(key)` | Press a layout key by character or name (`"ሀ"`, `"።"`, `"space"`, `"enter"`, `"backspace"`). |
| `backspace(count?)`, `clear()` | Delete text. |
| `getValue()`, `getState()`, `getLayout()` | Read the value, full state, or layout. |

## Agent integration

### LLM tool calling

`amharicKeyboardTools` holds JSON-schema tool definitions. Pass them to your model's tool-calling API, then route each call through `runAmharicKeyboardTool`:

```tsx
import { amharicKeyboardTools, runAmharicKeyboardTool } from '@amharic-virtual-keyboard/react';

// When your model returns a tool call:
const result = runAmharicKeyboardTool(keyboardRef.current, toolCall.name, toolCall.input);
// => { ok: true, result: { value: 'ሰላም', visible: true, ... } }
```

Tools: `amharic_keyboard_type`, `amharic_keyboard_press_key`, `amharic_keyboard_backspace`, `amharic_keyboard_clear`, `amharic_keyboard_get_state`, `amharic_keyboard_get_layout`, `amharic_keyboard_set_visibility`.

### Browser automation

Set `exposeAs` to drive the keyboard from Playwright, Puppeteer or a browser agent:

```tsx
<AmharicKeyboard exposeAs="amharicKeyboard" />
```

```ts
await page.evaluate(() => window.amharicKeyboard.typeText('ሰላም'));
await page.evaluate(() => window.amharicKeyboard.run('amharic_keyboard_get_state'));
```

The DOM is also stable to select: the root has `data-amharic-keyboard="open"`, and every key has `data-key-type` (`char`, `point`, `space`, `enter`, `backspace`, `family`) and `data-key-value` (the character, or the key type for named keys):

```ts
await page.click('.keyboard-key[data-key-value="ሀ"]');
await page.click('.keyboard-child-button[data-key-value="ሁ"]');
```

## License

MIT © [amuif](https://github.com/amuif)
