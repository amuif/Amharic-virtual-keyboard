import { useState, useRef } from 'react'
import { AmharicKeyboard } from './AmharicKeyboard'
import './AmharicKeyboard.css'

function App() {
  const input1Ref = useRef<HTMLInputElement>(null)
  const input2Ref = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const keyboardRef = useRef<any>(null)
  const [showKeyboard, setShowKeyboard] = useState(true)

  return (
    <div className="container">
      <h1>Amharic Keyboard Development</h1>

      <div>
        <h3>Input 1:</h3>
        <input ref={input1Ref} type="text" placeholder="Type here..." />

        <h3>Input 2:</h3>
        <input ref={input2Ref} type="text" placeholder="Another input..." />

        <h3>Textarea:</h3>
        <textarea ref={textareaRef} rows={4} placeholder="Textarea..." />
      </div>

      {showKeyboard && (
        <AmharicKeyboard
          ref={keyboardRef}
          targetInputs={[
            input1Ref.current!,
            input2Ref.current!,
            textareaRef.current!
          ]}
          draggable={true}
          showHeader={true}
          minWidth={500}
          minHeight={380}
          onClose={() => setShowKeyboard(false)}
          style={{ zIndex: 1000 }}
        />
      )}
    </div>
  )
}

export default App
