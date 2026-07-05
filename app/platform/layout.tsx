import { requirePlatformAdmin } from "@/lib/auth/guards";
import { PlatformShell } from "@/components/layout/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requirePlatformAdmin();

  return <PlatformShell ctx={ctx}>{children}</PlatformShell>;
}
