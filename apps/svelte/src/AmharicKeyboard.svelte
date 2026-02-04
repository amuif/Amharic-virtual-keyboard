<script lang="ts">
  import {
    amharicLayout,
    type KeyboardLayout,
    type Key,
  } from "@amharic-keyboard/core";
  import { untrack } from "svelte";
  import type { AmharicKeyboardProps, AmharicKeyboardAPI } from "./types";
  import "./style.css";

  let {
    targetInput = undefined,
    targetInputs = undefined,
    layout = amharicLayout,
    draggable = true,
    showHeader = true,
    minimizeButton = true,
    closeButton = false,
    minWidth = 300,
    minHeight = 200,
    maxWidth = 800,
    maxHeight = 500,
    className = "",
    style = "",
    onclose = () => {},
  }: AmharicKeyboardProps & { onclose?: () => void } = $props();

  let value = $state("");
  let activeFamily = $state<{ value: string; children: string[] } | null>(null);
  let currentChildren = $state<string[]>([]);
  let isDragging = $state(false);
  let isResizing = $state(false);
  let isMinimized = $state(false);
  let isVisible = $state(true);
  let position = $state({ x: 20, y: 20 });
  let size = $state({
    width: untrack(() => minWidth),
    height: untrack(() => minHeight),
  });
  let dragOffset = $state({ x: 0, y: 0 });
  let resizeStart = $state({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  let keyboardElement: HTMLDivElement | null = $state(null);
  let currentInput: HTMLInputElement | HTMLTextAreaElement | null =
    $state(null);
  let inputs = $state<(HTMLInputElement | HTMLTextAreaElement)[]>([]);
  let cleanupFunctions = $state<(() => void)[]>([]);

  // Main reactive API
  // Main reactive API
  export function addInput(input: HTMLInputElement | HTMLTextAreaElement) {
    if (inputs.includes(input)) return false;
    inputs = [...inputs, input];
    setupInputListeners(input);
    if (!currentInput) {
      currentInput = input;
      value = input.value || "";
    }
    return true;
  }

  export function removeInput(input: HTMLInputElement | HTMLTextAreaElement) {
    const idx = inputs.indexOf(input);
    if (idx === -1) return false;
    inputs = inputs.filter((_, i) => i !== idx);
    cleanupInputListeners(input);
    if (currentInput === input) {
      currentInput = inputs[0] ?? null;
      value = currentInput?.value ?? "";
    }
    return true;
  }

  export function switchToInput(input: HTMLInputElement | HTMLTextAreaElement) {
    if (currentInput === input || !inputs.includes(input)) return false;
    currentInput = input;
    value = input.value;
    activeFamily = null;
    currentChildren = [];
    if (keyboardElement) keyboardElement.style.opacity = "1";
    return true;
  }

  export const getCurrentInput = () => currentInput;
  export const getAllInputs = () => [...inputs];

  export function show() {
    isVisible = true;
    isMinimized = false;
  }

  export function hide() {
    isVisible = false;
  }

  export function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  export function moveTo(x: number, y: number) {
    position = { x, y };
  }

  export function resize(width: number, height: number) {
    const w = Math.max(minWidth, Math.min(width, maxWidth));
    const h = Math.max(minHeight, Math.min(height, maxHeight));
    size = { width: w, height: h };
  }

  export function syncInput() {
    if (currentInput) value = currentInput.value;
  }

  export const getValue = () => value;

  // ── Input event handling ─────────────────────────────────
  function setupInputListeners(input: HTMLInputElement | HTMLTextAreaElement) {
    const onFocus = () => {
      if (currentInput !== input && inputs.includes(input)) {
        currentInput = input;
        value = input.value;
        activeFamily = null;
        currentChildren = [];
        if (keyboardElement) keyboardElement.style.opacity = "1";
      }
    };

    const onInputOrChange = () => {
      if (currentInput === input) {
        value = input.value;
      }
    };

    input.addEventListener("focus", onFocus);
    input.addEventListener("input", onInputOrChange);
    input.addEventListener("change", onInputOrChange);

    cleanupFunctions = [
      ...cleanupFunctions,
      () => {
        input.removeEventListener("focus", onFocus);
        input.removeEventListener("input", onInputOrChange);
        input.removeEventListener("change", onInputOrChange);
      },
    ];
  }

  function cleanupInputListeners(
    input: HTMLInputElement | HTMLTextAreaElement,
  ) {
    const parent = input.parentNode;
    if (parent) {
      const clone = input.cloneNode(true) as typeof input;
      clone.value = input.value;
      parent.replaceChild(clone, input);
    }
  }

  // ── Lifecycle: initialize inputs + global listeners ─────
  $effect(() => {
    if (targetInputs?.length) {
      const valid = targetInputs.filter(
        (el): el is HTMLInputElement | HTMLTextAreaElement =>
          el != null && "addEventListener" in el,
      );
      inputs = valid;
      if (valid.length > 0) {
        currentInput = valid[0] ?? null;
        value = currentInput?.value ?? "";
        valid.forEach(setupInputListeners);
      }
    } else if (targetInput && "addEventListener" in targetInput) {
      inputs = [targetInput];
      setupInputListeners(targetInput);
      currentInput = targetInput;
      value = targetInput.value ?? "";
    }

    const onDocClick = (e: MouseEvent) => {
      if (keyboardElement && !keyboardElement.contains(e.target as Node)) {
        keyboardElement.style.opacity = "0.7";
      }
    };

    document.addEventListener("click", onDocClick);

    return () => {
      document.removeEventListener("click", onDocClick);
      cleanupFunctions.forEach((fn) => fn());
      cleanupFunctions = [];
    };
  });

  // ── Drag logic ───────────────────────────────────────────
  let dragMoveHandler: ((e: MouseEvent) => void) | undefined;
  let dragEndHandler: (() => void) | undefined;

  function handleDragStart(e: MouseEvent) {
    if (!draggable || !keyboardElement) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.classList.contains("resize-handle")
    )
      return;

    e.preventDefault();
    isDragging = true;

    const rect = keyboardElement.getBoundingClientRect();
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    dragMoveHandler = (moveE: MouseEvent) => {
      if (!isDragging) return;
      moveE.preventDefault();

      let x = moveE.clientX - dragOffset.x;
      let y = moveE.clientY - dragOffset.y;

      const w = keyboardElement?.offsetWidth ?? 0;
      const h = keyboardElement?.offsetHeight ?? 0;
      x = Math.max(0, Math.min(x, window.innerWidth - w));
      y = Math.max(0, Math.min(y, window.innerHeight - h));

      position = { x, y };
    };

    dragEndHandler = () => {
      isDragging = false;
      if (dragMoveHandler)
        document.removeEventListener("mousemove", dragMoveHandler);
      if (dragEndHandler)
        document.removeEventListener("mouseup", dragEndHandler);
      dragMoveHandler = dragEndHandler = undefined;
    };

    document.addEventListener("mousemove", dragMoveHandler);
    document.addEventListener("mouseup", dragEndHandler);
  }

  // ── Resize logic ─────────────────────────────────────────
  let resizeMoveHandler: ((e: MouseEvent) => void) | undefined;
  let resizeEndHandler: (() => void) | undefined;

  function handleResizeStart(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };

    resizeMoveHandler = (moveE: MouseEvent) => {
      if (!isResizing) return;
      moveE.preventDefault();

      let w = resizeStart.width + (moveE.clientX - resizeStart.x);
      let h = resizeStart.height + (moveE.clientY - resizeStart.y);

      w = Math.max(minWidth, Math.min(w, maxWidth, window.innerWidth * 0.9));
      h = Math.max(minHeight, Math.min(h, maxHeight, window.innerHeight * 0.9));

      size = { width: w, height: h };

      // Keep in viewport
      if (keyboardElement) {
        const r = keyboardElement.getBoundingClientRect();
        if (r.right > window.innerWidth) {
          position.x = Math.max(0, window.innerWidth - w);
        }
        if (r.bottom > window.innerHeight) {
          position.y = Math.max(0, window.innerHeight - h);
        }
      }
    };

    resizeEndHandler = () => {
      isResizing = false;
      if (resizeMoveHandler)
        document.removeEventListener("mousemove", resizeMoveHandler);
      if (resizeEndHandler)
        document.removeEventListener("mouseup", resizeEndHandler);
      resizeMoveHandler = resizeEndHandler = undefined;
    };

    document.addEventListener("mousemove", resizeMoveHandler);
    document.addEventListener("mouseup", resizeEndHandler);
  }

  // ── Keyboard actions ─────────────────────────────────────
  function updateInput(newValue: string) {
    if (!currentInput) return;
    currentInput.value = newValue;
    currentInput.focus();
    currentInput.dispatchEvent(new Event("input", { bubbles: true }));
    value = currentInput.value;
  }

  function insertCharacter(char: string) {
    const newVal = value + char;
    value = newVal;
    updateInput(newVal);
  }

  function handleKeyPress(key: Key) {
    if (!currentInput) return;

    if (key.type === "char" && key.children?.length && key.value) {
      activeFamily = { value: key.value, children: key.children };
      insertCharacter(key.value);
      currentChildren = [key.value, ...key.children];
      return;
    }

    activeFamily = null;
    currentChildren = [];

    if (key.type === "char" || key.type === "point") {
      insertCharacter(key.value || "");
    } else if (key.type === "space") {
      insertCharacter(" ");
    } else if (key.type === "enter") {
      insertCharacter("\n");
    } else if (key.type === "backspace") {
      const newVal = value.slice(0, -1);
      value = newVal;
      updateInput(newVal);
    }
  }

  function handleChildButtonClick(char: string) {
    if (!char || !activeFamily) return;

    const familyChars = [activeFamily.value, ...activeFamily.children];
    if (familyChars.includes(char)) {
      // Replace last char
      const newVal = value.slice(0, -1) + char;
      value = newVal;
      updateInput(newVal);
    } else {
      insertCharacter(char);
    }
  }

  function handleClose() {
    onclose();
  }

  // ── Derived style ────────────────────────────────────────
  let keyboardStyle = $derived(`
    position: fixed;
    left:   ${position.x}px;
    top:    ${position.y}px;
    width:  ${size.width}px;
    height: ${size.height}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 10px;
    background: #e0e0e0;
    border: 1px solid #ccc;
    border-radius: 5px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    user-select: none;
    transition: ${isDragging || isResizing ? "none" : "all 0.3s ease"};
    cursor: ${isDragging ? "grabbing" : "default"};
    overflow: hidden;
    ${style}
  `);
</script>

{#if !isVisible}
  <!-- nothing -->
{:else if isMinimized}
  <button
    class="amharic-virtual-keyboard-minimized"
    style="
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
      font-size: 24px;
      transition: all 0.3s ease;
      border: none;
      padding: 0;
    "
    onclick={() => (isMinimized = false)}
    onmouseenter={(e) => {
      e.currentTarget.style.transform = "scale(1.1)";
      e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.4)";
    }}
    onmouseleave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    }}
    title="Click to restore Amharic Keyboard"
    aria-label="Restore Amharic Keyboard"
  >
    ⌨
  </button>
{:else}
  <div
    bind:this={keyboardElement}
    class="amharic-virtual-keyboard {className}"
    style={keyboardStyle}
    onmousedown={handleDragStart}
    role="dialog"
    aria-label="Virtual Keyboard"
    tabindex="-1"
  >
    {#if showHeader}
      <div
        class="keyboard-header"
        style="
          width: 100%;
          padding: 8px 12px;
          background: #2c3e50;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: {draggable ? 'move' : 'default'};
          border-radius: 5px 5px 0 0;
          margin-bottom: 10px;
          user-select: none;
        "
      >
        <span style="font-weight: bold">Amharic Keyboard</span>
        <div style="display: flex; gap: 8px">
          {#if minimizeButton}
            <button
              onclick={() => (isMinimized = true)}
              style="background:transparent; border:1px solid rgba(255,255,255,0.3); color:white; width:24px; height:24px; border-radius:3px; font-size:18px;"
              >−</button
            >
          {/if}
          {#if closeButton}
            <button
              onclick={handleClose}
              style="background:transparent; border:1px solid rgba(255,255,255,0.3); color:white; width:24px; height:24px; border-radius:3px; font-size:18px;"
              >×</button
            >
          {/if}
        </div>
      </div>
    {/if}

    <!-- Child / modifier buttons -->
    <div
      style="display:flex; justify-content:center; margin-bottom:10px; width:100%; flex-wrap:wrap; gap:2px;"
    >
      {#each Array.from({ length: 8 }) as _, i}
        {#if currentChildren[i]}
          <button
            class="keyboard-child-button"
            style="margin:2px; padding:10px; min-width:40px; min-height:40px; font-size:18px; background:#d3d3d3; border:1px solid #ccc; border-radius:3px;"
            onclick={() => handleChildButtonClick(currentChildren[i]!)}
          >
            {currentChildren[i]}
          </button>
        {:else}
          <div
            style="margin:2px; padding:10px; min-width:40px; min-height:40px; font-size:18px; background:#e0e0e0; border:1px solid #ccc; border-radius:3px; opacity:0.5;"
          ></div>
        {/if}
      {/each}
    </div>

    <!-- Main keyboard rows -->
    {#each layout as row}
      <div
        style="display:flex; justify-content:center; margin-bottom:5px; width:100%;"
      >
        {#each row as key}
          <button
            class="keyboard-key"
            style="margin:2px; padding:8px; min-width:35px; min-height:40px; font-size:16px; border:1px solid #ccc; border-radius:3px; background:white; flex:1;"
            onclick={() => handleKeyPress(key)}
          >
            {key.label}
          </button>
        {/each}
      </div>
    {/each}

    <!-- Bottom-right resize handle -->
    <div
      class="resize-handle"
      style="
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: se-resize;
        background: linear-gradient(135deg, transparent 50%, #888 50%);
      "
      onmousedown={handleResizeStart}
      role="button"
      aria-label="Resize handle"
      tabindex="0"
    ></div>
  </div>
{/if}
