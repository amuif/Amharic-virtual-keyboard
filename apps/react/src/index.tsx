export { AmharicKeyboard } from './AmharicKeyboard';
export { useAmharicKeyboard } from './useAmharicKeyboard';
export type { AmharicKeyboardRefHandle } from './useAmharicKeyboard';
export {
  amharicKeyboardTools,
  runAmharicKeyboardTool,
} from './agent';
export type {
  AmharicKeyboardToolName,
  AmharicKeyboardToolResult,
} from './agent';
export { insertText, deleteBackward, replaceBeforeCaret } from './editing';
export type { EditState, EditResult } from './editing';
export type {
  AmharicKeyboardProps,
  AmharicKeyboardRef,
  EditableElement,
  KeyboardTheme,
  KeyboardMode,
  KeyboardPosition,
  KeyboardSize,
  KeyboardClassNames,
  KeyboardState,
  KeyRenderProps,
  FamilyKeyRenderProps,
  HeaderRenderProps,
} from './types';
export { amharicLayout } from '@amharic-keyboard/core';
export type { Key, KeyType, KeyboardLayout, KeyboardRow } from '@amharic-keyboard/core';
