"use client";

import { useState } from "react";
import { signInWithPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Truck } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await signInWithPassword(formData);
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message === "NEXT_REDIRECT") {
        throw err;
      }
      toast.error(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <section className="hidden w-[42%] flex-col justify-between border-r border-border/80 bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-accent-foreground">
              Fleet Control
            </p>
            <p className="text-2xs text-sidebar-foreground/70">
              Transport operations
            </p>
          </div>
        </div>
        <div className="max-w-sm space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-sidebar-accent-foreground">
            Run trips, fleet, and settlements in one place
          </h2>
          <p className="text-sm leading-relaxed text-sidebar-foreground/80">
            Dispatch, track vehicles, manage drivers, and reconcile payments for
            your transport company.
          </p>
        </div>
        <p className="text-2xs text-sidebar-foreground/50">
          Secure sign-in for authorized staff only
        </p>
      </section>

      <section className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fleet Control for your company account
            </p>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your company email and password
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>
            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
