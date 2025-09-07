import { useParentStore } from "../../store/parentStore";

export default function ChildSwitcher({
  onSelect,
}: {
  onSelect: (studentId: string) => void;
}) {
  const children = useParentStore((s) => s.children);
  if (!children.length) return null;
  return (
    <select
      className="select select-bordered"
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="">Select Child</option>
      {children.map((child) => (
        <option key={child._id} value={child.studentId}>
          {child.fullName} ({child.studentId})
        </option>
      ))}
    </select>
  );
}
