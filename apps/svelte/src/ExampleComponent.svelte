<script lang="ts">
  import { AmharicKeyboard } from "./index";

  let input1: HTMLInputElement;
  let input2: HTMLInputElement;
  let textarea: HTMLTextAreaElement;

  let keyboardAPI: any = $state();

  let showKeyboard = $state(true);

  $effect(() => {
    const timer = setTimeout(() => {
      if (keyboardAPI) {
        keyboardAPI.addInput(input1);
        keyboardAPI.addInput(input2);
        keyboardAPI.addInput(textarea);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  });

  function handleClose() {
    showKeyboard = false;
  }
</script>

<div class="container">
  <h1>Amharic Keyboard Svelte 5</h1>

  <div style="margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap;">
    <button onclick={() => (showKeyboard = !showKeyboard)}>
      {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
    </button>
    <button onclick={() => keyboardAPI?.show()}>Show via API</button>
    <button onclick={() => keyboardAPI?.hide()}>Hide via API</button>
    <button onclick={() => keyboardAPI?.toggleMinimize()}>
      Minimize/Restore
    </button>
    <button onclick={() => keyboardAPI?.moveTo(100, 100)}>
      Move to (100, 100)
    </button>
    <button onclick={() => keyboardAPI?.resize(600, 400)}>
      Resize to 600×400
    </button>
  </div>

  <div style="display: flex; flex-direction: column; gap: 15px;">
    <div>
      <label for="first-name" style="display: block; margin-bottom: 5px"
        >First Name:</label
      >
      <input
        bind:this={input1}
        type="text"
        style="width: 100%; padding: 12px; font-size: 16px"
        placeholder="Click here to type..."
      />
    </div>

    <div>
      <label for="last-name" style="display: block; margin-bottom: 5px"
        >Last Name:</label
      >
      <input
        bind:this={input2}
        type="text"
        style="width: 100%; padding: 12px; font-size: 16px"
        placeholder="Or click here..."
      />
    </div>

    <div>
      <label for="description" style="display: block; margin-bottom: 5px"
        >Description:</label
      >
      <textarea
        bind:this={textarea}
        rows={4}
        style="width: 100%; padding: 12px; font-size: 16px"
        placeholder="Or type in this textarea..."
      ></textarea>
    </div>
  </div>

  {#if showKeyboard}
    <AmharicKeyboard
      bind:this={keyboardAPI}
      draggable={true}
      showHeader={true}
      minimizeButton={true}
      closeButton={true}
      minWidth={500}
      minHeight={380}
      onclose={handleClose}
      style="z-index: 1000;"
    />
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  button {
    padding: 10px 20px;
    background: #2c3e50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
  }

  button:hover {
    background: #34495e;
  }

  label {
    font-weight: 500;
  }

  input,
  textarea {
    border: 2px solid #ddd;
    border-radius: 8px;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #339af0;
  }
</style>
