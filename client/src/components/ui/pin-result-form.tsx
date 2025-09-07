import { useState } from "react";
import { useUnlockResults } from "../../hooks/useResults";

export default function PinResultForm({
  onSuccess,
}: {
  onSuccess: (data: any) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const unlockResults = useUnlockResults();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!term || !year) {
        setError("Please select term and year");
        setLoading(false);
        return;
      }
      const data = await unlockResults(studentId, pin, term, parseInt(year));
      onSuccess(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Invalid PIN, Student ID, or details"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <input
        type="password"
        placeholder="Result PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <select
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="input input-bordered w-full"
        required
      >
        <option value="">Select Term</option>
        <option value="First">First Term</option>
        <option value="Second">Second Term</option>
        <option value="Third">Third Term</option>
      </select>
      <input
        type="number"
        placeholder="Year (e.g. 2025)"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="input input-bordered w-full"
        required
        min="2000"
        max={new Date().getFullYear() + 1}
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? "Checking..." : "Unlock Results"}
      </button>
    </form>
  );
}
