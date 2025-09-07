import { mvpFeatures } from "./features";

export default function EdgeCases() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edge Case Coverage</h1>
      <ul className="list-disc pl-6 space-y-2">
        {mvpFeatures
          .filter((f) => f.title === "Edge Case Handling")
          .map((f, i) => (
            <li key={i} className="text-lg">
              {f.description}
            </li>
          ))}
      </ul>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Tested Scenarios:</h2>
        <ul className="list-decimal pl-6 space-y-1">
          <li>Student joins mid-term: Backdating attendance/results allowed</li>
          <li>Exam rescheduling: Timetable updates and notifications sent</li>
          <li>
            Teacher reassignment mid-term: History preserved, reassignment
            possible
          </li>
          <li>Parent with multiple children: Dashboard links all children</li>
          <li>Offline classroom use: PWA sync fallback enabled</li>
          <li>Result PIN misuse: PIN required, audit logs for all access</li>
          <li>Fee unpaid: Results locked until payment</li>
        </ul>
      </div>
    </div>
  );
}
