import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquareText } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Communicate with your drivers, staff, and customers."
      />
      <EmptyState
        icon={MessageSquareText}
        title="Messages Module Coming Soon"
        description="The integrated chat and SMS module will be available in a future update."
      />
    </div>
  );
}
