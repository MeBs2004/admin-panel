import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

/**
 * `items`: [{ label, to? }] — the last item is rendered as plain
 * text (current page), earlier items link via `to` when provided.
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <FiChevronRight className="h-3 w-3 shrink-0" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-gray-500 dark:text-gray-400" : ""}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
