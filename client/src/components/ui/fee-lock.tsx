import { useStudentStore } from "../../store/studentStore";

export default function FeeLock({ children }: { children: React.ReactNode }) {
  const profile = useStudentStore((s) => s.profile);
  const hasUnpaid = profile?.termFees?.some((fee) => !fee.paid);
  if (hasUnpaid) {
    return (
      <div className="bg-yellow-100 p-4 rounded text-yellow-800">
        Results are locked until all fees are paid.
      </div>
    );
  }
  return <>{children}</>;
}
