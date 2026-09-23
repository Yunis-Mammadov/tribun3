import type { Metadata } from "next";

import TeamTriviaGame from "../../components/TeamTriviaGame";

export const metadata: Metadata = {
  title: "Ne Kadar Taraftarsın?",

  description:
    "Tuttuğun takımı ne kadar iyi tanıyorsun? Futbol bilgini zamana karşı test et.",

  alternates: {
    canonical: "/oyunlar/ne-kadar-taraftarsin",
  },

  openGraph: {
    title: "Ne Kadar Taraftarsın? | Tribün",
    description:
      "Takımını ne kadar iyi tanıdığını zamana karşı test et.",
    url: "/oyunlar/ne-kadar-taraftarsin",
  },
};

export default function FanQuizPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="font-semibold uppercase tracking-widest text-zinc-500">
        Tribün Oyunu
      </p>

      <h1 className="mt-4 text-5xl font-black">
        Ne Kadar Taraftarsın?
      </h1>

      <p className="mt-6 text-lg leading-8 text-zinc-400">
        Kayıt olurken seçtiğin takım hakkında sorulan sorulara
        mümkün olan en kısa sürede cevap ver. Doğru cevap ve hız,
        puanını belirler.
      </p>

      <div className="my-10">
        <TeamTriviaGame />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">
          Nasıl oynanır?
        </h2>

        <p className="mt-4 leading-8 text-zinc-400">
          Her turda tuttuğun takım hakkında bir soru gösterilir.
          Dört seçenekten doğru olanı süre dolmadan seçmen gerekir.
          Seri doğru cevaplar ve hızlı cevaplar daha yüksek puan
          kazandırır.
        </p>
      </section>
    </main>
  );
}