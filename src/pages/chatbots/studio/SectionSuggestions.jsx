import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import Input from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";
import { MAX_SUGGESTIONS } from "../../../config/chatbotConfigDefaults.js";
import Toggle from "../../../components/ui/Toggle.jsx";
import Field from "../../../components/studio/Field.jsx";

// `value` is the array itself (config.suggestions) — same
// whole-array-replace convention as SectionCTAs/forms.fields.
export default function SectionSuggestions({ value = [], onChange, show = true, onShowChange }) {
  const suggestions = value;

  const update = (index, text) => {
    onChange(suggestions.map((s, i) => (i === index ? text : s)));
  };

  const remove = (index) => {
    onChange(suggestions.filter((_, i) => i !== index));
  };

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= suggestions.length) return;
    const next = [...suggestions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    onChange([...suggestions, ""]);
  };

  return (
    <div className="space-y-5" data-field="suggestions">
      {onShowChange && (
        <Field id="chatWindow.showSuggestions">
          <Toggle label="Show the suggestion chips" description="Hide the quick-reply chips without deleting them." checked={show} onChange={onShowChange} />
        </Field>
      )}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Suggestions</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Quick-reply chips shown before the visitor's first message. Leave empty to use your company's
          existing shared suggestions instead.
        </p>
      </div>

      <div className="space-y-2.5">
        {suggestions.length === 0 && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400 dark:bg-white/5">
            No per-chatbot suggestions set — using the company's shared suggestions.
          </p>
        )}

        {suggestions.map((text, index) => (
          <div key={index} data-field={`suggestions.${index}`} className="flex items-center gap-1.5 rounded-xl">
            <Input
              value={text}
              maxLength={80}
              placeholder="What services do you offer?"
              onChange={(e) => update(index, e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              aria-label="Move up"
            >
              <FiArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => move(index, 1)}
              disabled={index === suggestions.length - 1}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              aria-label="Move down"
            >
              <FiArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => remove(index)}
              className="text-gray-400 hover:text-danger-500"
              aria-label="Remove suggestion"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <Button variant="secondary" onClick={add} disabled={suggestions.length >= MAX_SUGGESTIONS}>
          <FiPlus className="h-3.5 w-3.5" /> Add Suggestion
        </Button>
        {suggestions.length >= MAX_SUGGESTIONS && (
          <p className="text-xs text-gray-400">Maximum of {MAX_SUGGESTIONS} suggestions.</p>
        )}
      </div>
    </div>
  );
}
