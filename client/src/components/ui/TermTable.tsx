import { useTermsQuery, Term } from "@/hooks/useTermsQuery";
import { useActivateTermMutation } from "@/hooks/useActivateTermMutation";

export default function TermTable() {
  const { data: terms, isLoading, error } = useTermsQuery();
  const activateTermMutation = useActivateTermMutation();

  const handleActivate = async (termId: string) => {
    try {
      await activateTermMutation.mutateAsync(termId);
      alert("Term activated successfully!");
    } catch (error: any) {
      console.error("Error activating term:", error);
      alert(
        `Error activating term: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading terms.</div>;
  if (!terms || terms.length === 0) return <div>No terms found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Term Name</th>
            <th>Academic Year</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((term: Term) => (
            <tr key={term._id} className={term.isActive ? "bg-green-100" : ""}>
              <td>{term.name} Term</td>
              <td>
                {term.year}/{term.year + 1}
              </td>
              <td>{term.isActive ? "Active" : "Inactive"}</td>
              <td>{new Date(term.createdAt).toLocaleString()}</td>
              <td>
                {!term.isActive && (
                  <button
                    onClick={() => handleActivate(term._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={activateTermMutation.isPending}
                  >
                    {activateTermMutation.isPending
                      ? "Activating..."
                      : "Activate"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
