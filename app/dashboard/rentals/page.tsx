import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RowActions } from "@/components/shared/row-actions";
import { softDeleteRental } from "@/actions/rentals";
import { RentalForm } from "@/components/rentals/rental-form";

type RentalRow = {
  id: string;
  vendor?: { name: string } | null;
  vehicle_number: string | null;
  vehicle_description: string | null;
  start_date: string;
  end_date: string;
  total_amount: number;
};

function RentalTable({ rows, parties }: { rows: RentalRow[], parties: any[] }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No rental records"
        description="Rent in and rent out entries will appear in this tab."
        compact
      />
    );
  }
  return (
    <DataTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.vendor?.name}</TableCell>
              <TableCell>{r.vehicle_number ?? r.vehicle_description}</TableCell>
              <TableCell className="tabular-nums">
                {formatDateIN(r.start_date)} — {formatDateIN(r.end_date)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCurrencyINR(r.total_amount)}
              </TableCell>
              <TableCell>
                <RowActions
                  editModalTitle="Edit Rental"
                  editContent={<RentalForm parties={parties} initialData={r} />}
                  onDelete={softDeleteRental.bind(null, r.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}

export default async function RentalsPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("rent_in_rent_out")
    .select("*, vendor:customers_parties(name)")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null);

  const rentIn = (data?.filter((r) => r.type === "rent_in") ?? []) as RentalRow[];
  const rentOut = (data?.filter((r) => r.type === "rent_out") ?? []) as RentalRow[];

  const { data: partiesData } = await supabase
    .from("customers_parties")
    .select("id, name, type")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("name");

  return (
    <div>
      <PageHeader
        title="Rent In / Rent Out"
        description="Track third-party vehicle rentals"
        action={
          <Button asChild>
            <Link href="/dashboard/rentals/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Rental
            </Link>
          </Button>
        }
      />
      <SectionPanel title="Rental agreements" contentClassName="p-4 pt-0">
        <Tabs defaultValue="rent_in">
          <TabsList className="mb-4">
            <TabsTrigger value="rent_in">Rent In</TabsTrigger>
            <TabsTrigger value="rent_out">Rent Out</TabsTrigger>
          </TabsList>
          <TabsContent value="rent_in">
            <RentalTable rows={rentIn} parties={partiesData || []} />
          </TabsContent>
          <TabsContent value="rent_out">
            <RentalTable rows={rentOut} parties={partiesData || []} />
          </TabsContent>
        </Tabs>
      </SectionPanel>
    </div>
  );
}
