import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Result {
  term: string;
  year: number;
  scores: { subject: string; score: number }[];
  comment: string;
  updatedBy: string;
  updatedAt: string;
}

export default function ResultPdfExport({ results }: { results: Result[] }) {
  const handleExport = () => {
    const doc = new jsPDF();
    results.forEach((result, idx) => {
      doc.text(`${result.term} Term ${result.year}`, 10, 10 + idx * 60);
      autoTable(doc, {
        startY: 15 + idx * 60,
        head: [["Subject", "Score"]],
        body: result.scores.map((s) => [s.subject, s.score]),
      });
      doc.text(`Comment: ${result.comment}`, 10, 45 + idx * 60);
      doc.text(
        `Updated by: ${result.updatedBy} on ${new Date(
          result.updatedAt
        ).toLocaleString()}`,
        10,
        52 + idx * 60
      );
    });
    doc.save("results.pdf");
  };
  return (
    <button className="btn btn-outline" onClick={handleExport}>
      Export Results as PDF
    </button>
  );
}
