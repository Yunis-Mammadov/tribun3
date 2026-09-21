import Link from "next/link";

import type { Game } from "../data/game";

type GameCardProps = {
    game: Game;
};

export default function GameCard({ game }: GameCardProps) {
    return (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="mb-3 text-sm text-zinc-400">
                {game.questionCount} soru · Soru başına {game.secondsPerQuestion} saniye
            </p>

            <h2 className="text-2xl font-bold text-white">{game.title}</h2>

            <p className="mt-3 leading-7 text-zinc-300">
                {game.shortDescription}
            </p>

            <Link
                href={`/oyunlar/${game.slug}`}
                className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
                Oyuna git
            </Link>
        </article>
    );
}