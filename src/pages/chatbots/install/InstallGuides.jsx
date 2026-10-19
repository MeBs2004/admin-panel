import { useState } from "react";
import Tabs from "../../../components/ui/Tabs.jsx";
import CopyBlock from "./CopyBlock.jsx";
import { PLATFORM_GUIDES } from "./installUtils.js";

/** Per-platform "where to paste it" steps, with the snippet to copy. */
export default function InstallGuides({ snippet }) {
  const [active, setActive] = useState(PLATFORM_GUIDES[0].id);
  const guide = PLATFORM_GUIDES.find((g) => g.id === active);
  return (
    <div>
      <Tabs tabs={PLATFORM_GUIDES.map((g) => ({ value: g.id, label: g.label }))} active={active} onChange={setActive} />
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-4">
        <CopyBlock text={snippet} label="Copy line" />
      </div>
    </div>
  );
}
