import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrencyINR, formatDateIN } from "@/lib/utils/format";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select(
      "*, customer:customers_parties(*), driver:drivers(*), vehicle:vehicles(*)"
    )
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const { data: bill } = await supabase
    .from("bills")
    .select("*")
    .eq("trip_id", id)
    .single();

  const isRcm = bill?.is_reverse_charge ?? true; // Transport defaults to RCM
  const freight = trip.freight_amount ?? trip.bill_amount ?? 0;
  
  // Tax calculation (SAC 9965 is typically 5% without ITC or 12% with ITC)
  const taxRate = 0.05; 
  const taxAmount = isRcm ? 0 : freight * taxRate; // If RCM, transporter doesn't collect tax
  const totalAmount = freight + taxAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Invoice / Bilty - ${trip.trip_number}`}
          description="GST Compliant Tax Invoice for Transport Services"
        />
        <Button className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      <div className="mx-auto max-w-4xl bg-white p-8 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
        <div className="mb-8 border-b-2 border-slate-900 pb-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">
            Tax Invoice / Bilty
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Original for Recipient</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Transporter Details</h3>
            <div className="font-medium text-slate-900">Fleet Control Transport</div>
            <div className="text-sm text-slate-600 mt-1">
              123 Transport Nagar, Mumbai, Maharashtra 400001<br />
              <strong>GSTIN:</strong> 27ABCDE1234F1Z5<br />
              <strong>SAC Code:</strong> 9965 (Goods Transport Agency)
            </div>
          </div>
          <div className="text-right">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Details</h3>
            <div className="text-sm text-slate-600">
              <strong>Invoice No:</strong> {bill?.bill_no || `INV-${trip.trip_number}`}<br />
              <strong>Invoice Date:</strong> {formatDateIN(bill?.bill_date || new Date().toISOString())}<br />
              <strong>Trip No:</strong> {trip.trip_number}<br />
              <strong>Reverse Charge (RCM):</strong> {isRcm ? 'YES' : 'NO'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 rounded-lg border border-slate-200 p-4">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Billed To (Customer)</h3>
            <div className="font-semibold text-slate-900">{trip.customer?.name}</div>
            <div className="text-sm text-slate-600 mt-1">
              {trip.customer?.address || "Address not provided"}<br />
              <strong>GSTIN:</strong> {trip.customer?.gst_number || "Unregistered"}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Consignment Details</h3>
            <div className="text-sm text-slate-600 grid grid-cols-2 gap-y-2">
              <div><strong>Vehicle No:</strong> {trip.vehicle?.registration_number || "—"}</div>
              <div><strong>Driver:</strong> {trip.driver?.full_name || "—"}</div>
              <div><strong>From:</strong> {trip.origin}</div>
              <div><strong>To:</strong> {trip.destination}</div>
              <div><strong>LR No:</strong> {trip.lr_number || "—"}</div>
              <div><strong>E-Way Bill:</strong> {trip.eway_bill_no || "—"}</div>
            </div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Description of Service</th>
              <th className="py-3 px-4">Weight (Tons)</th>
              <th className="py-3 px-4 text-right">Rate</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr>
              <td className="py-4 px-4 font-medium text-slate-900">
                Transportation of Goods ({trip.goods_type || "General Cargo"})
              </td>
              <td className="py-4 px-4">{trip.weight_tons || "—"}</td>
              <td className="py-4 px-4 text-right">—</td>
              <td className="py-4 px-4 text-right font-medium">{formatCurrencyINR(freight)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2 rounded-lg border border-slate-200 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">{formatCurrencyINR(freight)}</span>
            </div>
            {!isRcm && (
              <>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">CGST (2.5%)</span>
                  <span className="font-medium text-slate-900">{formatCurrencyINR(taxAmount / 2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">SGST (2.5%)</span>
                  <span className="font-medium text-slate-900">{formatCurrencyINR(taxAmount / 2)}</span>
                </div>
              </>
            )}
            {isRcm && (
              <div className="flex justify-between py-1 text-xs text-blue-600">
                <span>GST payable by recipient under RCM</span>
              </div>
            )}
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900">
              <span>Grand Total</span>
              <span>{formatCurrencyINR(totalAmount)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-2 text-sm text-slate-500 font-medium">
          <div>
            Receiver's Signature / Stamp
            <div className="mt-1 text-xs text-slate-400">(Proof of Delivery)</div>
          </div>
          <div className="text-right">
            For Fleet Control Transport
            <div className="mt-8 text-xs text-slate-400">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
