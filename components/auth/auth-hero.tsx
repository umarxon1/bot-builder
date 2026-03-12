import Link from "next/link";

import { Card } from "@/components/ui/card";

export function AuthHero() {
  return (
    <Card className="flex h-full flex-col justify-between bg-[linear-gradient(145deg,_rgba(13,148,136,0.96),_rgba(15,23,42,0.96))] p-8 text-white">
      <div>
        <Link href="/" className="font-semibold tracking-[0.18em] uppercase text-teal-100">
          BotBuilder Uz
        </Link>
        <h1 className="mt-8 text-4xl font-semibold leading-tight">
          Telegram botlaringizni biznes jarayoniga aylantiring.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-teal-50/90">
          Lead capture, order form, broadcasts va analytics bitta Uzbek-friendly admin
          panel ichida.
        </p>
      </div>
      <div className="rounded-[24px] border border-white/12 bg-white/10 p-5 text-sm leading-7 text-teal-50/90">
        <p>1 workspace per user, 1 bot per workspace, 1 published flow.</p>
        <p className="mt-3">
          {"MVP soddalik uchun qurilgan, lekin arxitektura keyin ko'p workspace va ko'p bot"}
          {" modeliga kengayishi mumkin."}
        </p>
      </div>
    </Card>
  );
}
