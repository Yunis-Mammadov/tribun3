import type { Metadata } from "next";

import GameCard from "../components/GameCard";
import { games } from "../data/game";

export const metadata: Metadata = {
    title: "Futbol Oyunları",
    description:
        "Futbol bilgini test edebileceğin Tribün oyunlarını keşfet.",

    alternates: {
        canonical: "/oyunlar",
    },
    openGraph: {
        title: "Futbol Oyunları | Tribün",
        description:
            "Futbol bilgini test edebileceğin Tribün oyunlarını keşfet.",
        url: "/oyunlar",
    },
};

export default function GamesPage() {
    return (
        <main className="mx-auto max-w-6xl px-6 py-20">
            <h1 className="text-5xl font-black">
                Futbol oyunları
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
                Bilgini zamana karşı test et, puanını yükselt ve
                taraftarlar arasında yerini al.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
                {games.map((game) => (
                    <GameCard key={game.slug} game={game} />
                ))}
            </div>
        </main>
    );
}