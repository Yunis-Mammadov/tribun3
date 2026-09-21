import type { Metadata } from "next";

import QuizDemo from "../../components/QuizDemo";

export const metadata: Metadata = {
    title: "Golü Kim Atmıştı?",

    description:
        "Unutulmaz futbol derbilerini hatırla ve golleri hangi futbolcuların attığını bul.",

    alternates: {
        canonical: "/oyunlar/golu-kim-atmisti",
    },

    openGraph: {
        title: "Golü Kim Atmıştı? | Tribün",
        description:
            "Unutulmaz derbileri hatırla ve golleri kimin attığını bul.",
        url: "/oyunlar/golu-kim-atmisti",
    },
};

export default function WhoScoredPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-20">
            <p className="font-semibold uppercase tracking-widest text-zinc-500">
                Tribün Oyunu
            </p>

            <h1 className="mt-4 text-5xl font-black">
                Golü Kim Atmıştı?
            </h1>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
                Geçmişten unutulmaz bir derbinin yılı ve skoru gösterilir.
                Gol atan oyunculardan biri eksik bırakılır. O futbolcuyu
                süre dolmadan bulabilir misin?
            </p>

            <div className="my-10">
                <QuizDemo seconds={10} />
            </div>

            <section className="mt-16">
                <h2 className="text-2xl font-bold">
                    Nasıl oynanır?
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                    Ekranda derbinin sezonu, iki takım ve maç sonucu yer alır.
                    Golcülerden eksik bırakılan futbolcuyu verilen seçenekler
                    arasından seçmen gerekir.
                </p>
            </section>
        </main>
    );
}