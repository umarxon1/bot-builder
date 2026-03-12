import { Card } from "@/components/ui/card";

export function SetupAlert({
  message,
  missingKeys,
}: {
  message: string;
  missingKeys: string[];
}) {
  return (
    <Card className="border-amber-200 bg-amber-50 p-5">
      <h3 className="text-lg font-semibold text-amber-950">Setup kerak</h3>
      <p className="mt-2 text-sm leading-6 text-amber-900">{message}</p>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 p-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-amber-700 uppercase">
          Missing keys
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-950">{missingKeys.join(", ")}</p>
      </div>
      <p className="mt-3 text-sm text-amber-900">
        `.env.example` nusxasidan `.env.local` yarating va serverni qayta ishga tushiring.
      </p>
    </Card>
  );
}
