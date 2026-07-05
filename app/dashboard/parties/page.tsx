import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionPanel } from "@/components/shared/section-panel";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";

export default async function PartiesPage() {
  const ctx = await getSessionContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers_parties")
    .select("*")
    .eq("company_id", ctx!.effectiveCompanyId!)
    .is("deleted_at", null)
    .order("name");

  const customers = data?.filter((p) => p.type === "customer") ?? [];
  const vendors = data?.filter((p) => p.type === "vendor") ?? [];

  function TableList({ rows, label }: { rows: typeof customers; label: string }) {
    if (!rows.length) {
      return (
        <EmptyState
          icon={Building2}
          title={`No ${label}`}
          description={`Add ${label} to link trips and payments.`}
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/parties/new">Add {label.slice(0, -1)}</Link>
            </Button>
          }
          compact
        />
      );
    }
    return (
      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.contact_person ?? "—"}</TableCell>
                <TableCell>{p.phone ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers & Parties"
        description="Customers and vendors linked to trips and billing"
        action={
          <Button asChild>
            <Link href="/dashboard/parties/new">Add Party</Link>
          </Button>
        }
      />
      <SectionPanel title="Party directory" contentClassName="p-4 pt-0">
        <Tabs defaultValue="customers">
          <TabsList className="mb-4">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          <TabsContent value="customers">
            <TableList rows={customers} label="customers" />
          </TabsContent>
          <TabsContent value="vendors">
            <TableList rows={vendors} label="vendors" />
          </TabsContent>
        </Tabs>
      </SectionPanel>
    </div>
  );
}
