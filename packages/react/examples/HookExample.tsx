import React, { useRef, useEffect } from 'react';
import { AmharicKeyboard, useAmharicKeyboard } from '../src';

export const HookExample: React.FC = () => {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const keyboardRef = useRef<any>(null);
  const { addInput } = useAmharicKeyboard();

  useEffect(() => {
    // Set keyboard ref for the hook
    addInput.setKeyboardRef(keyboardRef.current);

    // Add inputs
    if (nameRef.current) addInput.addInput(nameRef.current);
    if (emailRef.current) addInput.addInput(emailRef.current);
  }, [addInput]);

  return (
    <form>
      <input ref={nameRef} placeholder="Name" />
      <input ref={emailRef} placeholder="Email" />
      <AmharicKeyboard ref={keyboardRef} />
    </form>
  );
};
