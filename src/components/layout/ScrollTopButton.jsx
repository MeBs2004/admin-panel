import { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";

// Appears after scrolling down the page area; glides back to the top.
export default function ScrollTopButton({ scrollRef }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onScroll = () => setShow(el.scrollTop > 420);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="pop-in fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-primary-600 text-white shadow-glow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95"
    >
      <FiArrowUp className="h-5 w-5" />
    </button>
  );
}
