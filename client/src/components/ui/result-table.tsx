interface Result {
  term: string;
  year: number;
  scores: { subject: string; score: number }[];
  comment: string;
  updatedBy: string;
  updatedAt: string;
}

export default function ResultTable({ results }: { results: Result[] }) {
  if (!results.length) return <div>No results available.</div>;
  return (
    <div className="overflow-x-auto">
      {results.map((result, i) => (
        <div key={i} className="mb-6 border rounded p-4">
          <div className="font-bold mb-2">
            {result.term} Term {result.year}
          </div>
          <table className="table w-full mb-2">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {result.scores.map((s, j) => (
                <tr key={j}>
                  <td>{s.subject}</td>
                  <td>{s.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-sm text-gray-600">Comment: {result.comment}</div>
          <div className="text-xs text-gray-400">
            Updated by: {result.updatedBy} on{" "}
            {new Date(result.updatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
