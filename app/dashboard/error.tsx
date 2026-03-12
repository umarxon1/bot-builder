"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold text-slate-950">Dashboard xatolikka uchradi</h2>
      <p className="mt-3 text-sm text-slate-600">{error.message}</p>
      <Button className="mt-6" onClick={reset}>
        {"Qayta urinib ko'rish"}
      </Button>
    </Card>
  );
}
