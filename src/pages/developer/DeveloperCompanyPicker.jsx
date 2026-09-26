import Select from "../../components/ui/Select.jsx";

export default function DeveloperCompanyPicker({ companies, companyId, onChange }) {
  if (companies.length <= 1) return null;
  return (
    <div className="w-56">
      <Select
        options={companies.map((c) => ({ value: c.companyId, label: c.name }))}
        value={companyId}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
