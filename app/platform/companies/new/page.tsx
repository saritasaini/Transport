import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { CompanyForm } from "@/components/platform/company-form";

export default function NewCompanyPage() {
  return (
    <div>
      <PageHeader
        title="New company"
        description="Onboard a new transport tenant"
      />
      <SectionPanel title="Company details">
        <CompanyForm />
      </SectionPanel>
    </div>
  );
}
