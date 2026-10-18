import type { AmharicKeyboardRef } from "./types";

// Tool definitions (JSON Schema inputs) for letting an AI agent drive the
// keyboard. Pass them to your LLM's tool/function-calling API, then route
// each tool call to `runAmharicKeyboardTool`.
export const amharicKeyboardTools = [
  {
    name: "amharic_keyboard_type",
    description:
      "Type text into the input the Amharic keyboard is attached to, at the caret. Accepts any text, including Ethiopic (Ge'ez) characters.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to insert." },
      },
      required: ["text"],
    },
  },
  {
    name: "amharic_keyboard_press_key",
    description:
      "Press one key of the on-screen layout by its character or label, e.g. \"ሀ\", \"1\", \"።\", \"⌫\", \"space\" or \"enter\".",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Key value or label." },
      },
      required: ["key"],
    },
  },
  {
    name: "amharic_keyboard_backspace",
    description: "Delete characters before the caret.",
    input_schema: {
      type: "object",
      properties: {
        count: { type: "integer", minimum: 1, description: "How many characters. Defaults to 1." },
      },
    },
  },
  {
    name: "amharic_keyboard_clear",
    description: "Clear the attached input.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "amharic_keyboard_get_state",
    description:
      "Get the keyboard state: current value, visibility, minimized flag, family options and whether an input is attached.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "amharic_keyboard_get_layout",
    description:
      "Get the keyboard layout: rows of keys, each with its type, label, value and family characters (children).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "amharic_keyboard_set_visibility",
    description: "Show, hide, minimize or restore the keyboard.",
    input_schema: {
      type: "object",
      properties: {
        visibility: { type: "string", enum: ["show", "hide", "minimize", "restore"] },
      },
      required: ["visibility"],
    },
  },
] as const;

export type AmharicKeyboardToolName = (typeof amharicKeyboardTools)[number]["name"];

export interface AmharicKeyboardToolResult {
  ok: boolean;
  result?: unknown;
  error?: string;
}

export const runAmharicKeyboardTool = (
  keyboard: AmharicKeyboardRef | null | undefined,
  name: string,
  input: Record<string, unknown> = {},
): AmharicKeyboardToolResult => {
  if (!keyboard) return { ok: false, error: "Keyboard is not mounted." };

  const done = (ok: boolean, failure: string) =>
    ok ? { ok, result: keyboard.getState() } : { ok, error: failure };

  switch (name) {
    case "amharic_keyboard_type":
      if (typeof input.text !== "string") return { ok: false, error: "`text` must be a string." };
      return done(keyboard.typeText(input.text), "No input is attached to the keyboard.");
    case "amharic_keyboard_press_key":
      if (typeof input.key !== "string") return { ok: false, error: "`key` must be a string." };
      return done(
        keyboard.pressKey(input.key),
        `Unknown key "${input.key}" or no input attached. Call amharic_keyboard_get_layout to list keys.`,
      );
    case "amharic_keyboard_backspace": {
      const count = typeof input.count === "number" ? input.count : 1;
      return done(keyboard.backspace(count), "No input is attached to the keyboard.");
    }
    case "amharic_keyboard_clear":
      return done(keyboard.clear(), "No input is attached to the keyboard.");
    case "amharic_keyboard_get_state":
      return { ok: true, result: keyboard.getState() };
    case "amharic_keyboard_get_layout":
      return { ok: true, result: keyboard.getLayout() };
    case "amharic_keyboard_set_visibility":
      switch (input.visibility) {
        case "show":
          keyboard.show();
          break;
        case "hide":
          keyboard.hide();
          break;
        case "minimize":
          keyboard.setMinimized(true);
          break;
        case "restore":
          keyboard.setMinimized(false);
          break;
        default:
          return { ok: false, error: "`visibility` must be show, hide, minimize or restore." };
      }
      return { ok: true };
    default:
      return { ok: false, error: `Unknown tool "${name}".` };
  }
};
