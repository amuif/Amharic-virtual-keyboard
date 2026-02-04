import React, { useRef } from 'react';
import userEvent from '@testing-library/user-event';
import type { AmharicKeyboardRef } from '../types';

// Create a test component that uses the keyboard
export function createTestComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardRef = useRef<AmharicKeyboardRef>(null);
  
  const TestComponent = ({ showKeyboard = true }) => (
    <div>
      <input 
        ref={inputRef} 
        data-testid="test-input" 
        placeholder="Test input" 
      />
      {/* In tests, we'll mock the keyboard component */}
    </div>
  );
  
  return { TestComponent, inputRef, keyboardRef };
}

// Mock user event setup
export function setupUserEvent() {
  return userEvent.setup();
}

// Wait for promises to resolve
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
