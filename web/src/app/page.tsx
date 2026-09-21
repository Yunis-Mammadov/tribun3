import Link from "next/link";

import GameCard from "../app/components/GameCard";
import { games } from "../app/data/game";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tribün",
    url: process.env.SITE_URL ?? "http://localhost:3000",
    description:
      "Futbol bilgini test et, takımın için yarış ve diğer taraftarlarla rekabet et.",
    inLanguage: "tr",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 font-semibold uppercase tracking-widest text-zinc-500">
          Futbol bilgini kanıtla
        </p>

        <h1 className="max-w-4xl text-5xl font-black leading-tight sm:text-7xl">
          Tribündeki yerini futbol bilginle kazan.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Takımın için yarış, unutulmaz maçları hatırla ve diğer
          taraftarlarla rekabet et.
        </p>

        <Link
          href="/oyunlar"
          className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-black"
        >
          Oyunları keşfet
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-8 text-3xl font-bold">
          İlk oyunlar
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}