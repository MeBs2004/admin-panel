import { FiBriefcase } from "react-icons/fi";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

const NAME_MAX = 100;

export default function StepBasics({ form, setForm, companies, companiesLoading, errors }) {
  if (companiesLoading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-10 w-full" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={FiBriefcase}
        title="No company available"
        description="You need Company Admin access to at least one company before creating a chatbot. Contact your Super Admin."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Create your chatbot
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start with a name and the company this chatbot belongs to.
        </p>
      </div>

      <Select
        label="Company"
        options={companies.map((c) => ({ value: c.companyId, label: c.name }))}
        value={form.companyId}
        onChange={(e) => setForm({ ...form, companyId: e.target.value })}
      />

      <Input
        label="Chatbot Name"
        placeholder="e.g. Support Assistant"
        value={form.name}
        maxLength={NAME_MAX}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
      />
      <p className="-mt-3 text-xs text-gray-400">
        {form.name.length}/{NAME_MAX} characters
      </p>
    </div>
  );
}
