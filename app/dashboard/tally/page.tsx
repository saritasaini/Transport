import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

const EXPORTS = [
  {
    title: "Export expenses (journal)",
    description: "CSV / Excel for Tally import",
    href: "/api/tally/export-expenses",
    variant: "default" as const,
  },
  {
    title: "Export sales entries",
    description: "From completed trips",
    href: "/api/tally/export-sales",
    variant: "outline" as const,
  },
];

export default function TallyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tally Integration"
        description="Export and import ledger data for Tally reconciliation"
      />
      <SectionPanel title="Exports">
        <ul className="divide-y divide-border/60">
          {EXPORTS.map((item) => (
            <li
              key={item.href}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button asChild variant={item.variant} className="shrink-0">
                <Link href={item.href}>
                  <Download className="h-4 w-4" />
                  Download CSV
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </SectionPanel>
      <SectionPanel title="Import ledger">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">Upload Tally CSV</p>
            <p className="text-sm text-muted-foreground">
              POST CSV to /api/tally/import-ledger (upload form coming soon).
            </p>
          </div>
          <Button variant="outline" disabled className="shrink-0">
            <Upload className="h-4 w-4" />
            Upload CSV
          </Button>
        </div>
      </SectionPanel>
    </div>
  );
}
