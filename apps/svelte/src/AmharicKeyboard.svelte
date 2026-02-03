<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { amharicLayout } from "@amharic-keyboard/core";
  import type {
    KeyboardKey,
    KeyboardLayout,
    AmharicKeyboardProps,
    AmharicKeyboardAPI,
  } from "./types";
  import "./style.css";

  const dispatch = createEventDispatcher();

  export let targetInput: HTMLInputElement | HTMLTextAreaElement | undefined;
  export let targetInputs:
    | (HTMLInputElement | HTMLTextAreaElement)[]
    | undefined;
  export let layout: KeyboardLayout = amharicLayout;
  export let draggable = true;
  export let showHeader = true;
  export let minimizeButton = true;
  export let closeButton = false;
  export let minWidth = 300;
  export let minHeight = 200;
  export let maxWidth = 800;
  export let maxHeight = 500;
  export let className = "";
  export let style = "";

  // Internal state
  let value = "";
  let activeFamily: { value: string; children: string[] } | null = null;
  let currentChildren: string[] = [];
  let isDragging = false;
  let isResizing = false;
  let isMinimized = false;
  let isVisible = true;
  let position = { x: 20, y: 20 };
  let size = { width: minWidth, height: minHeight };
  let dragOffset = { x: 0, y: 0 };
  let resizeStart = { x: 0, y: 0, width: minWidth, height: minHeight };

  // Refs
  let keyboardElement: HTMLDivElement;
  let currentInput: HTMLInputElement | HTMLTextAreaElement | null = null;
  let inputs: (HTMLInputElement | HTMLTextAreaElement)[] = [];
  let cleanupFunctions: (() => void)[] = [];

  // API methods
  const api: AmharicKeyboardAPI = {
    addInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
      if (!inputs.includes(input)) {
        inputs.push(input);
        setupInputListeners(input);

        if (!currentInput) {
          currentInput = input;
          value = input.value || "";
        }
        return true;
      }
      return false;
    },

    removeInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
      const index = inputs.indexOf(input);
      if (index > -1) {
        inputs.splice(index, 1);
        cleanupInputListeners(input);

        if (currentInput === input) {
          currentInput = inputs[0] || null;
          value = currentInput?.value || "";
        }
        return true;
      }
      return false;
    },

    switchToInput: (input: HTMLInputElement | HTMLTextAreaElement) => {
      if (currentInput !== input && inputs.includes(input)) {
        currentInput = input;
        value = input.value;
        activeFamily = null;
        currentChildren = [];

        if (keyboardElement) {
          keyboardElement.style.opacity = "1";
        }
        return true;
      }
      return false;
    },

    getCurrentInput: () => currentInput,

    getAllInputs: () => [...inputs],

    show: () => {
      isVisible = true;
      isMinimized = false;
    },

    hide: () => {
      isVisible = false;
    },

    toggleMinimize: () => {
      isMinimized = !isMinimized;
    },

    moveTo: (x: number, y: number) => {
      position = { x, y };
    },

    resize: (width: number, height: number) => {
      const newWidth = Math.max(minWidth, Math.min(width, maxWidth));
      const newHeight = Math.max(minHeight, Math.min(height, maxHeight));
      size = { width: newWidth, height: newHeight };
    },

    syncInput: () => {
      if (currentInput) {
        value = currentInput.value;
      }
    },

    getValue: () => value,
  };

  // Expose API
  export { api };

  // Setup input listeners
  function setupInputListeners(input: HTMLInputElement | HTMLTextAreaElement) {
    const focusHandler = () => {
      if (currentInput !== input && inputs.includes(input)) {
        currentInput = input;
        value = input.value;
        activeFamily = null;
        currentChildren = [];

        if (keyboardElement) {
          keyboardElement.style.opacity = "1";
        }
      }
    };

    const inputHandler = () => {
      if (currentInput === input) {
        value = input.value;
      }
    };

    input.addEventListener("focus", focusHandler);
    input.addEventListener("input", inputHandler);
    input.addEventListener("change", inputHandler);

    cleanupFunctions.push(() => {
      input.removeEventListener("focus", focusHandler);
      input.removeEventListener("input", inputHandler);
      input.removeEventListener("change", inputHandler);
    });
  }

  // Cleanup input listeners
  function cleanupInputListeners(
    input: HTMLInputElement | HTMLTextAreaElement,
  ) {
    // Clone and replace to remove all listeners
    const parent = input.parentNode;
    if (parent) {
      const newInput = input.cloneNode(true) as
        | HTMLInputElement
        | HTMLTextAreaElement;
      newInput.value = input.value;
      parent.replaceChild(newInput, input);
    }
  }

  // Initialize
  onMount(() => {
    if (targetInputs && targetInputs.length > 0) {
      const validInputs = targetInputs.filter(
        (input): input is HTMLInputElement | HTMLTextAreaElement =>
          input != null && "addEventListener" in input,
      );

      inputs = validInputs;

      if (validInputs.length > 0) {
        currentInput = validInputs[0];
        value = currentInput?.value || "";

        validInputs.forEach((input) => setupInputListeners(input));
      }
    } else if (targetInput && "addEventListener" in targetInput) {
      inputs = [targetInput];
      setupInputListeners(targetInput);
      currentInput = targetInput;
      value = targetInput.value || "";
    }

    // Global click listener
    const handleDocumentClick = (e: MouseEvent) => {
      if (keyboardElement && !keyboardElement.contains(e.target as Node)) {
        keyboardElement.style.opacity = "0.7";
      }
    };

    document.addEventListener("click", handleDocumentClick);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      cleanupFunctions.forEach((cleanup) => cleanup());
      cleanupFunctions = [];
    };
  });

  // Drag functionality
  let dragMoveHandler: (e: MouseEvent) => void;
  let dragEndHandler: () => void;

  function handleDragStart(e: MouseEvent) {
    if (!draggable || !keyboardElement) return;

    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.classList.contains("resize-handle")
    ) {
      return;
    }

    e.preventDefault();
    isDragging = true;
    const rect = keyboardElement.getBoundingClientRect();
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    dragMoveHandler = (moveEvent: MouseEvent) => {
      if (!isDragging) return;
      moveEvent.preventDefault();

      const x = moveEvent.clientX - dragOffset.x;
      const y = moveEvent.clientY - dragOffset.y;

      const keyboardWidth = keyboardElement.offsetWidth;
      const keyboardHeight = keyboardElement.offsetHeight;
      const maxX = window.innerWidth - keyboardWidth;
      const maxY = window.innerHeight - keyboardHeight;

      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));

      position = { x: boundedX, y: boundedY };
    };

    dragEndHandler = () => {
      isDragging = false;
      document.removeEventListener("mousemove", dragMoveHandler);
      document.removeEventListener("mouseup", dragEndHandler);
    };

    document.addEventListener("mousemove", dragMoveHandler);
    document.addEventListener("mouseup", dragEndHandler);
  }

  // Resize functionality
  let resizeMoveHandler: (e: MouseEvent) => void;
  let resizeEndHandler: () => void;

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

    resizeMoveHandler = (moveEvent: MouseEvent) => {
      if (!isResizing) return;
      moveEvent.preventDefault();

      const deltaX = moveEvent.clientX - resizeStart.x;
      const deltaY = moveEvent.clientY - resizeStart.y;

      let newWidth = resizeStart.width + deltaX;
      let newHeight = resizeStart.height + deltaY;

      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

      const maxViewportWidth = window.innerWidth * 0.9;
      const maxViewportHeight = window.innerHeight * 0.9;
      newWidth = Math.min(newWidth, maxViewportWidth);
      newHeight = Math.min(newHeight, maxViewportHeight);

      size = { width: newWidth, height: newHeight };

      if (keyboardElement) {
        const rect = keyboardElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          const newLeft = window.innerWidth - newWidth;
          position = { ...position, x: Math.max(0, newLeft) };
        }

        if (rect.bottom > window.innerHeight) {
          const newTop = window.innerHeight - newHeight;
          position = { ...position, y: Math.max(0, newTop) };
        }
      }
    };

    resizeEndHandler = () => {
      isResizing = false;
      document.removeEventListener("mousemove", resizeMoveHandler);
      document.removeEventListener("mouseup", resizeEndHandler);
    };

    document.addEventListener("mousemove", resizeMoveHandler);
    document.addEventListener("mouseup", resizeEndHandler);
  }

  // Keyboard input handling
  function syncInput(newValue: string) {
    if (currentInput) {
      currentInput.value = newValue;
      currentInput.focus();
      currentInput.dispatchEvent(new Event("input", { bubbles: true }));
      value = currentInput.value;
    }
  }

  function insertCharacter(char: string) {
    const newValue = value + char;
    value = newValue;
    syncInput(newValue);
  }

  function handleKeyPress(key: KeyboardKey) {
    if (!currentInput) return;

    if (key.type === "char" && key.children?.length) {
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
      const newValue = value.slice(0, -1);
      value = newValue;
      syncInput(newValue);
    }
  }

  function handleChildButtonClick(char: string) {
    if (!char || !activeFamily) return;

    const isSameFamily = [
      activeFamily.value,
      ...activeFamily.children,
    ].includes(char);

    if (isSameFamily) {
      const newValue = value.slice(0, -1) + char;
      value = newValue;
      syncInput(newValue);
    } else {
      insertCharacter(char);
    }
  }

  function handleClose() {
    dispatch("close");
  }

  // Cleanup drag/resize handlers
  onDestroy(() => {
    if (dragMoveHandler) {
      document.removeEventListener("mousemove", dragMoveHandler);
    }
    if (dragEndHandler) {
      document.removeEventListener("mouseup", dragEndHandler);
    }
    if (resizeMoveHandler) {
      document.removeEventListener("mousemove", resizeMoveHandler);
    }
    if (resizeEndHandler) {
      document.removeEventListener("mouseup", resizeEndHandler);
    }
  });

  // Keyboard style
  $: keyboardStyle = `
    position: fixed;
    left: ${position.x}px;
    top: ${position.y}px;
    width: ${size.width}px;
    height: ${size.height}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0px 10px;
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
  `;
</script>

{#if !isVisible}
  <!-- Hidden -->
{:else if isMinimized}
  <div
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
      user-select: none;
      transition: all 0.3s ease;
    "
    on:click={() => (isMinimized = false)}
    on:mouseenter={(e) => {
      e.currentTarget.style.transform = "scale(1.1)";
      e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.4)";
    }}
    on:mouseleave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    }}
    title="Click to restore Amharic Keyboard"
  >
    ⌨
  </div>
{:else}
  <div
    bind:this={keyboardElement}
    class="amharic-virtual-keyboard {className}"
    style={keyboardStyle}
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
        on:mousedown={handleDragStart}
      >
        <span style="font-weight: bold">Amharic Keyboard</span>
        <div style="display: flex; gap: 8px">
          {#if minimizeButton}
            <button
              on:click={() => (isMinimized = true)}
              style="
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
              "
            >
              −
            </button>
          {/if}
          {#if closeButton}
            <button
              on:click={handleClose}
              style="
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
              "
            >
              ×
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Child buttons -->
    <div
      style="
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
        width: 100%;
        flex-wrap: wrap;
        gap: 2px;
      "
    >
      {#each Array.from({ length: 8 }) as _, i}
        {#if currentChildren[i]}
          <button
            class="keyboard-child-button"
            style="
        margin: 2px;
        padding: 10px;
        min-width: 40px;
        min-height: 40px;
        font-size: 18px;
        cursor: pointer;
        background: #d3d3d3;
        border: 1px solid #ccc;
        border-radius: 3px;
        opacity: 1;
      "
            on:click={() => handleChildButtonClick(currentChildren[i])}
          >
            {currentChildren[i]}
          </button>
        {:else}
          <button
            class="keyboard-child-button"
            style="
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
      "
            disabled
          >
            <!-- empty button -->
          </button>
        {/if}
      {/each}
    </div>

    <!-- Keyboard rows -->
    {#each layout as row, rowIndex}
      <div
        style="
          display: flex;
          justify-content: center;
          margin-bottom: 5px;
          width: 100%;
        "
      >
        {#each row as key, keyIndex}
          <button
            class="keyboard-key"
            style="
              margin: 2px;
              padding: 8px;
              min-width: 35px;
              min-height: 40px;
              font-size: 16px;
              cursor: pointer;
              border: 1px solid #ccc;
              border-radius: 3px;
              background: white;
              flex: 1;
            "
            on:click={() => handleKeyPress(key)}
          >
            {key.label}
          </button>
        {/each}
      </div>
    {/each}

    <!-- Resize handle -->
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
      on:mousedown={handleResizeStart}
    />
  </div>
{/if}
