// Pure text-editing helpers. They take the current value and selection and
// return the new value and caret position, so they work the same for DOM
// inputs, controlled React state and the keyboard's internal buffer.

export interface EditState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface EditResult {
  value: string;
  caret: number;
}

const clampSelection = ({ value, selectionStart, selectionEnd }: EditState) => {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  return { start, end };
};

export const insertText = (state: EditState, text: string): EditResult => {
  const { start, end } = clampSelection(state);
  return {
    value: state.value.slice(0, start) + text + state.value.slice(end),
    caret: start + text.length,
  };
};

export const deleteBackward = (state: EditState): EditResult => {
  const { start, end } = clampSelection(state);
  if (start !== end) {
    return { value: state.value.slice(0, start) + state.value.slice(end), caret: start };
  }
  if (start === 0) return { value: state.value, caret: 0 };

  // Remove a whole surrogate pair rather than half of one
  const code = state.value.charCodeAt(start - 1);
  const width = code >= 0xdc00 && code <= 0xdfff && start > 1 ? 2 : 1;
  return {
    value: state.value.slice(0, start - width) + state.value.slice(start),
    caret: start - width,
  };
};

// Replaces `expected` immediately before the caret with `replacement`.
// Returns null when the text before the caret doesn't match.
export const replaceBeforeCaret = (
  state: EditState,
  expected: string,
  replacement: string,
): EditResult | null => {
  const { start, end } = clampSelection(state);
  if (start !== end || start < expected.length) return null;
  if (state.value.slice(start - expected.length, start) !== expected) return null;
  return {
    value: state.value.slice(0, start - expected.length) + replacement + state.value.slice(start),
    caret: start - expected.length + replacement.length,
  };
};
