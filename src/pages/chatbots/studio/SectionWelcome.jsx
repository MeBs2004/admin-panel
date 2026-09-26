export default function SectionWelcome({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Welcome message
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          The first message visitors see when they open the chat window.
        </p>
      </div>

      <label className="block">
        <textarea
          rows={4}
          maxLength={300}
          placeholder="Hi! How can we help you today?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
        />
        <span className="mt-1 block text-xs text-gray-400">{value.length}/300</span>
      </label>
    </div>
  );
}
