<div align="center">

# ⌨️ Amharic Virtual Keyboard

**A drop-in, on-screen Amharic (Ge'ez / Ethiopic) keyboard for the web.**
Works with React, Svelte, or plain HTML. Draggable, resizable, and attaches to any input or textarea.

[![npm react](https://img.shields.io/npm/v/@amharic-virtual-keyboard/react?label=react&color=61dafb)](https://www.npmjs.com/package/@amharic-virtual-keyboard/react)
[![npm svelte](https://img.shields.io/npm/v/@amharic-virtual-keyboard/svelte?label=svelte&color=ff3e00)](https://www.npmjs.com/package/@amharic-virtual-keyboard/svelte)
[![license](https://img.shields.io/badge/license-MIT-green)](#license)
[![stars](https://img.shields.io/github/stars/amuif/Amharic-virtual-keyboard?style=social)](https://github.com/amuif/Amharic-virtual-keyboard)

### [▶ Try the live demo](https://DEMO-URL-HERE)

<!-- Replace with a 5–10s GIF of typing ሰላም ዓለም with the keyboard -->
<img src="./docs/demo.gif" alt="Typing Amharic with the virtual keyboard" width="640" />

</div>

---

## Why

Most people writing Amharic online don't have an Ethiopic keyboard installed, especially on shared or work computers. If your site has a name field, a search box, or a comment form that should accept Amharic, this gives your users a way to type it without installing anything.

## Features

- **Full fidelity.** Tap a base character (ለ) to reveal its whole family (ሉ ሊ ላ ሌ ል ሎ ሏ), including labialized forms like ቈ ኰ ኈ.
- **Draggable and resizable.** Users can move it out of the way, resize it, or minimize it.
- **Multiple inputs.** Attach one keyboard to several fields and it follows whichever one is focused.
- **Programmatic control.** Show, hide, move, resize and switch inputs from your own code.
- **Custom layouts.** Pass your own layout to adapt it to other Ethiopic-script languages.
- **Framework-agnostic core.** One shared layout and logic package, with thin React, Svelte and vanilla wrappers.

## Install

```bash
# React
npm install @amharic-virtual-keyboard/react

# Svelte 5
npm install @amharic-virtual-keyboard/svelte
```

## Quick start

### React

```tsx
import { useState } from "react";
import { AmharicKeyboard } from "@amharic-virtual-keyboard/react";
import "@amharic-virtual-keyboard/react/dist/react.css";

export default function App() {
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  return (
    <>
      <input ref={setInput} placeholder="ስምዎን ያስገቡ…" />
      {input && <AmharicKeyboard targetInput={input} />}
    </>
  );
}
```

### Svelte 5

```svelte
<script>
  import { AmharicKeyboard } from "@amharic-virtual-keyboard/svelte";
  import "@amharic-virtual-keyboard/svelte/dist/style.css";

  let input = $state();
</script>

<input bind:this={input} placeholder="ስምዎን ያስገቡ…" />
{#if input}<AmharicKeyboard targetInput={input} />{/if}
```

### Several inputs, one keyboard

```tsx
<AmharicKeyboard targetInputs={[firstName, lastName, address]} />
```

The keyboard switches to whichever field the user focuses.

## Common props

Both components share these options.

| Prop | Type | Default | What it does |
| :--- | :--- | :--- | :--- |
| `targetInput` | `HTMLInputElement \| HTMLTextAreaElement` | — | The field to type into. |
| `targetInputs` | `Array<HTMLInputElement \| HTMLTextAreaElement>` | — | Several fields; follows the focused one. |
| `layout` | `KeyboardLayout` | `amharicLayout` | A custom layout (see `@amharic-keyboard/core`). |
| `draggable` | `boolean` | `true` | Let users drag the keyboard around. |
| `showHeader` | `boolean` | `true` | Show the header / drag handle. |
| `minimizeButton` | `boolean` | `true` | Show the minimize button. |
| `closeButton` | `boolean` | `false` | Show a close button. |
| `minWidth` / `maxWidth` | `number` | — | Width limits while resizing. |
| `minHeight` / `maxHeight` | `number` | — | Height limits while resizing. |
| `onClose` | `() => void` | — | Called when the user closes it. |
| `className` / `style` | — | — | Style the container. |

Full API references, including the `useAmharicKeyboard` hook and instance methods:

- **React:** [apps/react/README.md](./apps/react/README.md)
- **Svelte:** [apps/svelte/README.md](./apps/svelte/README.md)

## Packages

| Package | Description |
| :--- | :--- |
| [`@amharic-virtual-keyboard/react`](./apps/react) | React component and `useAmharicKeyboard` hook |
| [`@amharic-virtual-keyboard/svelte`](./apps/svelte) | Svelte 5 component |
| [`apps/html`](./apps/html) | Vanilla TypeScript implementation (no framework) |
| [`@amharic-keyboard/core`](./packages/core) | Shared layout data and types used by every wrapper |

## Roadmap

- [ ] Publish the vanilla HTML version to npm and a CDN
- [ ] Tigrinya and other Ethiopic-script layouts
- [ ] Touch/pointer support for dragging on mobile
- [ ] Theming via CSS variables

Ideas and requests are welcome in [Issues](https://github.com/amuif/Amharic-virtual-keyboard/issues).

## Contributing

This is a [Turborepo](https://turbo.build/repo) monorepo using pnpm.

```bash
# Requirements: Node >= 18, pnpm >= 9
pnpm install   # install everything
pnpm dev       # run all demo apps
pnpm build     # build every package
pnpm test      # run tests (inside apps/react or apps/svelte)
```

Layouts live in `packages/core/src/layout`, so a new language is mostly a data change there.

## License

MIT © [Ibrahim Hassen (amuif)](https://github.com/amuif)
