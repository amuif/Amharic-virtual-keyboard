export type KeyType =
  | 'char'
  | 'space'
  | 'shift'
  | 'backspace'
  | 'enter'
  | 'point'

export interface Key {
  type: KeyType;
  label: string;
  value?: string;
  children?: string[]
}

export type KeyboardRow = Key[];
export type KeyboardLayout = KeyboardRow[];
