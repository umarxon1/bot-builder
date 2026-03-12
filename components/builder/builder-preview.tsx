import type { FlowNodeWithButtons } from "@/types/app";
import { Card } from "@/components/ui/card";

export function BuilderPreview({
  node,
  published,
}: {
  node: FlowNodeWithButtons | null;
  published: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-950">Conversation preview</h2>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
          {published ? "Published" : "Draft"}
        </span>
      </div>
      {node ? (
        <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-slate-50">
          <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7">{node.content}</div>
          <div className="mt-4 grid gap-2">
            {node.buttons.length ? (
              node.buttons.map((button) => (
                <div
                  key={button.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  {button.label}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-slate-300">
                {"Bu node uchun button yo'q."}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-600">
          Preview uchun start node yoki published flow kerak.
        </p>
      )}
    </Card>
  );
}
