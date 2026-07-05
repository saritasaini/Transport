import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const REPORTS = [
  { id: "driver", title: "Driver Report", href: "/api/export/driver?format=xlsx" },
  { id: "vehicle", title: "Vehicle Report", href: "/api/export/vehicle?format=xlsx" },
  { id: "expense", title: "Expense Report", href: "/api/export/expense?format=xlsx" },
  { id: "financial", title: "Financial P&L", href: "/api/export/financial?format=xlsx" },
  { id: "settlement", title: "Bill Settlement", href: "/api/export/settlement?format=pdf" },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export Excel, PDF, or XML. Use date filters via query params (from, to)."
      />
      <SectionPanel title="Available exports">
        <ul className="divide-y divide-border/60">
          {REPORTS.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{r.title}</p>
                <p className="text-sm text-muted-foreground">
                  Download in Excel or PDF format
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={r.href}>
                    <Download className="h-4 w-4" />
                    Excel
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`${r.href.replace("xlsx", "pdf").replace("format=pdf", "format=pdf")}`}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SectionPanel>
    </div>
  );
}
