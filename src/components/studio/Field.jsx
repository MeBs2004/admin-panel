// Marks a control so "click to edit" in the preview can find it, open its
// section, expand its group and flash it. Renders no visual of its own.
export default function Field({ id, className = "", children }) {
  return (
    <div data-field={id} className={`rounded-xl transition-shadow ${className}`}>
      {children}
    </div>
  );
}
