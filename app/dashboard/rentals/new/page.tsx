import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { RentalForm } from "@/components/rentals/rental-form";

export default async function NewRentalPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  
  const { data: parties } = await supabase
    .from("customers_parties")
    .select("id, name, type")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Add Rental Agreement"
        description="Create a new Rent In or Rent Out record."
      />
      <RentalForm parties={parties || []} />
    </div>
  );
}
