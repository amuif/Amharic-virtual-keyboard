import React, { useRef } from 'react';
import { AmharicKeyboard } from '../src';

export const BasicExample: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardRef = useRef<any>(null);

  return (
    <div>
      <input ref={inputRef} type="text" />
      <AmharicKeyboard 
        ref={keyboardRef}
        targetInput={inputRef.current!}
        draggable={true}
        showHeader={true}
      />
    </div>
  );
};
