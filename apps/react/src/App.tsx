import { useState, useRef, useEffect } from "react";
import {
  AmharicKeyboard,
  useAmharicKeyboard,
  runAmharicKeyboardTool,
  type KeyboardMode,
  type KeyboardTheme,
} from "./index";

const fieldStyle = { width: "100%", padding: "12px", fontSize: "16px", boxSizing: "border-box" } as const;

function App() {
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { keyboardRef, addInput, showKeyboard: show, hideKeyboard: hide, minimizeKeyboard } =
    useAmharicKeyboard();
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [theme, setTheme] = useState<KeyboardTheme>("light");
  const [mode, setMode] = useState<KeyboardMode>("floating");
  const [controlled, setControlled] = useState("ሰላም");
  const [agentText, setAgentText] = useState("ሰላም ልዑል");
  const [agentLog, setAgentLog] = useState("");

  useEffect(() => {
    if (input1Ref.current) addInput(input1Ref.current);
    if (input2Ref.current) addInput(input2Ref.current);
    if (textareaRef.current) addInput(textareaRef.current);
  }, [addInput]);

  const runTool = (name: string, input?: Record<string, unknown>) => {
    const result = runAmharicKeyboardTool(keyboardRef.current, name, input);
    setAgentLog(JSON.stringify(result, null, 2));
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        paddingBottom: mode === "floating" ? 360 : 20,
      }}
    >
      <h1>Amharic Keyboard React</h1>

      <div style={{ margin: "20px 0", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={() => setShowKeyboard(!showKeyboard)}>
          {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
        </button>
        <button onClick={show}>Show via Ref</button>
        <button onClick={hide}>Hide via Ref</button>
        <button onClick={minimizeKeyboard}>Minimize</button>
        <label>
          Theme{" "}
          <select value={theme} onChange={(e) => setTheme(e.target.value as KeyboardTheme)}>
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="auto">auto</option>
          </select>
        </label>
        <label>
          Mode{" "}
          <select value={mode} onChange={(e) => setMode(e.target.value as KeyboardMode)}>
            <option value="floating">floating</option>
            <option value="inline">inline</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <label>
          First Name:
          <input ref={input1Ref} type="text" style={fieldStyle} placeholder="Click here to type..." />
        </label>
        <label>
          Last Name:
          <input ref={input2Ref} type="text" style={fieldStyle} placeholder="Or click here..." />
        </label>
        <label>
          Description:
          <textarea ref={textareaRef} rows={4} style={fieldStyle} placeholder="Or type in this textarea..." />
        </label>
      </div>

      {showKeyboard && (
        <div style={{ marginTop: 20 }}>
          <AmharicKeyboard
            ref={keyboardRef}
            mode={mode}
            theme={theme}
            closeButton
            minWidth={600}
            minHeight={400}
            exposeAs="amharicKeyboard"
            onClose={() => setShowKeyboard(false)}
          />
        </div>
      )}

      <h2 style={{ marginTop: 32 }}>Controlled mode</h2>
      <p>The keyboard below owns no input; it edits React state through value/onChange.</p>
      <input
        value={controlled}
        onChange={(e) => setControlled(e.target.value)}
        style={fieldStyle}
        aria-label="Controlled value"
      />
      <div style={{ marginTop: 10 }}>
        <AmharicKeyboard
          mode="inline"
          theme={theme}
          value={controlled}
          onChange={setControlled}
          showHeader={false}
        />
      </div>

      <h2 style={{ marginTop: 32 }}>Agent tools</h2>
      <p>
        Calls the same tools an AI agent gets from <code>amharicKeyboardTools</code>. Also available
        as <code>window.amharicKeyboard</code>.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={agentText} onChange={(e) => setAgentText(e.target.value)} aria-label="Agent text" />
        <button onClick={() => runTool("amharic_keyboard_type", { text: agentText })}>type</button>
        <button onClick={() => runTool("amharic_keyboard_backspace", { count: 1 })}>backspace</button>
        <button onClick={() => runTool("amharic_keyboard_clear")}>clear</button>
        <button onClick={() => runTool("amharic_keyboard_get_state")}>get_state</button>
      </div>
      <pre style={{ background: "#f4f4f5", padding: 12, overflow: "auto", maxHeight: 200 }}>{agentLog}</pre>
    </div>
  );
}

export default App;
