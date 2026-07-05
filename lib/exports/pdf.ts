import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function exportTableToPdf(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
): Buffer {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 8 },
  });
  return Buffer.from(doc.output("arraybuffer"));
}
