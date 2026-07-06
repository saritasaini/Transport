import { PageHeader } from "@/components/shared/page-header";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard & Reports"
        description="View your business analytics and export filtered reports."
      />
      <ReportsDashboard />
    </div>
  );
}
