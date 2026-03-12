import Link from "next/link";
import { ArrowRight, BarChart3, MessageCircleMore, Send, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Telegram bot builder",
    description:
      "Button-based flow builder orqali lead capture, order form va menyularni bir joyda boshqaring.",
    icon: MessageCircleMore,
  },
  {
    title: "Mijoz va buyurtmalar",
    description:
      "Telegram foydalanuvchilari, leadlar va buyurtmalar bir workspace ichida saqlanadi.",
    icon: Users,
  },
  {
    title: "Broadcast yuborish",
    description:
      "Oldindan preview, tasdiqlash va batching bilan xavfsiz ommaviy xabarlar yuboring.",
    icon: Send,
  },
  {
    title: "Oddiy analytics",
    description:
      "7 kunlik activity, messages today va so'nggi interactionlar orqali tez nazorat qiling.",
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur">
        <div>
          <p className="font-semibold tracking-[0.2em] text-teal-700 uppercase">
            BotBuilder Uz
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600">
            Kirish
          </Link>
          <Button asChild>
            <Link href="/signup">Boshlash</Link>
          </Button>
        </div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
            MVP SaaS for Uzbekistan small businesses
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
              {"Telegram botlarni tez qurish, boshqarish va o'stirish uchun bir panel."}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {"BotBuilder Uz kichik biznes egalariga Telegram bot token ulash, button flow "}
              {"yaratish, lead va order yig'ish, broadcast yuborish hamda analytics ko'rish "}
              {"imkonini beradi."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Demo workspace yaratish
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Mavjud akkaunt bilan kirish</Link>
            </Button>
          </div>
        </div>

        <Card className="grid gap-5 border-teal-100 p-6 shadow-[0_35px_90px_-40px_rgba(13,148,136,0.4)]">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-50">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Flow preview</span>
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-teal-200">
                Published
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                {"Assalomu alaykum! Buyurtma, narxlar yoki operator bilan bog'lanish uchun"}
                {" tanlang."}
              </div>
              <div className="grid gap-2">
                {["Katalog", "Buyurtma qoldirish", "Operator bilan gaplashish"].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    >
                      {label}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4"
              >
                <feature.icon className="mb-3 size-5 text-teal-700" />
                <h2 className="font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
