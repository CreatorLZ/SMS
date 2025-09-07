import { TimetableEntry } from "../../store/timetableStore";

export default function TimetableTable({
  timetable,
}: {
  timetable: TimetableEntry[];
}) {
  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th>Day</th>
          <th>Subject</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {timetable.map((entry, i) => (
          <tr key={i}>
            <td>{entry.day}</td>
            <td>{entry.subject}</td>
            <td>{entry.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
