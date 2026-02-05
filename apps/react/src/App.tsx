import { useState, useRef, useEffect } from "react";
import { AmharicKeyboard } from "./index";

function App() {
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const keyboardRef = useRef<any>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyboardRef.current) {
        if (input1Ref.current) keyboardRef.current.addInput(input1Ref.current);
        if (input2Ref.current) keyboardRef.current.addInput(input2Ref.current);
        if (textareaRef.current)
          keyboardRef.current.addInput(textareaRef.current);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Amharic Keyboard React</h1>

      <div
        style={{
          margin: "20px 0",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => setShowKeyboard(!showKeyboard)}>
          {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
        </button>
        <button onClick={() => keyboardRef.current?.show()}>
          Show via Ref
        </button>
        <button onClick={() => keyboardRef.current?.hide()}>
          Hide via Ref
        </button>
        <button onClick={() => keyboardRef.current?.toggleMinimize()}>
          Minimize/Restore
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            First Name:
          </label>
          <input
            ref={input1Ref}
            type="text"
            style={{ width: "100%", padding: "12px", fontSize: "16px" }}
            placeholder="Click here to type..."
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Last Name:
          </label>
          <input
            ref={input2Ref}
            type="text"
            style={{ width: "100%", padding: "12px", fontSize: "16px" }}
            placeholder="Or click here..."
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Description:
          </label>
          <textarea
            ref={textareaRef}
            rows={4}
            style={{ width: "100%", padding: "12px", fontSize: "16px" }}
            placeholder="Or type in this textarea..."
          />
        </div>
      </div>

      {showKeyboard && (
        <AmharicKeyboard
          ref={keyboardRef}
          draggable={true}
          showHeader={true}
          minWidth={500}
          minHeight={400}
          onClose={() => setShowKeyboard(false)}
          style={{ zIndex: 1000 }}
        />
      )}
    </div>
  );
}

export default App;
