"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
    type AccountSummary,
    getAccountSummary,
} from "@/lib/account-api";

type Status =
    | "loading"
    | "authenticated"
    | "unauthenticated"
    | "error";

export default function AccountDashboard() {
    const [status, setStatus] =
        useState<Status>("loading");

    const [summary, setSummary] =
        useState<AccountSummary | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        async function loadAccount() {
            try {
                const data = await getAccountSummary();

                setSummary(data);
                setStatus("authenticated");
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Hesap bilgileri yüklenemedi.";

                setError(message);

                if (
                    message.includes("giriş") ||
                    message.includes("Oturum")
                ) {
                    setStatus("unauthenticated");
                } else {
                    setStatus("error");
                }
            }
        }

        void loadAccount();
    }, []);

    if (status === "loading") {
        return (
            <div className="py-24 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

                <p className="mt-4 text-zinc-500">
                    Hesap bilgileri yükleniyor...
                </p>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Hesabım
                </p>

                <h1 className="mt-3 text-3xl font-black">
                    Önce giriş yapmalısın
                </h1>

                <p className="mt-4 text-zinc-400">
                    İstatistiklerini ve oyun geçmişini görmek
                    için hesabına giriş yap.
                </p>

                <Link
                    href="/giris"
                    className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-black"
                >
                    Giriş yap
                </Link>
            </section>
        );
    }

    if (status === "error" || !summary) {
        return (
            <section className="rounded-3xl border border-red-950 bg-red-950/20 p-8">
                <h1 className="text-2xl font-black text-red-300">
                    Bir hata oluştu
                </h1>

                <p className="mt-3 text-red-200/70">
                    {error}
                </p>
            </section>
        );
    }

    const { user, stats, recentGames } = summary;

    return (
        <>
            <section className="flex flex-col justify-between gap-6 border-b border-zinc-800 pb-10 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Hesabım
                    </p>

                    <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                        @{user.username}
                    </h1>

                    <p className="mt-3 text-zinc-400">
                        {user.email}
                    </p>
                </div>

                {user.favoriteTeam && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                            Takımın
                        </p>

                        <p className="mt-1 text-xl font-bold">
                            {user.favoriteTeam.name}
                        </p>
                    </div>
                )}
            </section>

            <section className="mt-10">
                <h2 className="text-2xl font-black">
                    İstatistikler
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Oynanan oyun"
                        value={stats.gamesPlayed.toString()}
                    />

                    <StatCard
                        label="Toplam puan"
                        value={stats.totalScore.toLocaleString(
                            "tr-TR",
                        )}
                    />

                    <StatCard
                        label="En yüksek puan"
                        value={stats.bestScore.toLocaleString(
                            "tr-TR",
                        )}
                    />

                    <StatCard
                        label="Doğruluk"
                        value={`%${stats.accuracy}`}
                    />
                </div>
            </section>

            <section className="mt-14">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-zinc-500">
                            Son performansların
                        </p>

                        <h2 className="mt-1 text-2xl font-black">
                            Son oyunlar
                        </h2>
                    </div>

                    <Link
                        href="/oyunlar"
                        className="text-sm font-semibold text-zinc-400 hover:text-white"
                    >
                        Oyunlara git
                    </Link>
                </div>

                {recentGames.length === 0 ? (
                    <div className="mt-6 rounded-3xl border border-dashed border-zinc-800 p-10 text-center">
                        <p className="font-semibold">
                            Henüz tamamlanmış bir oyunun yok.
                        </p>

                        <p className="mt-2 text-sm text-zinc-500">
                            İlk puanını kazanmak için bir oyun başlat.
                        </p>

                        <Link
                            href="/oyunlar"
                            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-black"
                        >
                            Oyunları keşfet
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 space-y-3">
                        {recentGames.map((game) => (
                            <article
                                key={game.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center"
                            >
                                <div>
                                    <p className="font-bold">
                                        {game.game.title}
                                    </p>

                                    <p className="mt-1 text-sm text-zinc-500">
                                        {game.team?.name ?? "Genel"}
                                        {" · "}
                                        {game.correctAnswers}/
                                        {game.totalQuestions} doğru
                                    </p>
                                </div>

                                <div className="sm:text-right">
                                    <p className="text-xl font-black">
                                        {game.score.toLocaleString("tr-TR")}
                                    </p>

                                    <p className="text-xs text-zinc-500">
                                        puan
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

type StatCardProps = {
    label: string;
    value: string;
};

function StatCard({
    label,
    value,
}: StatCardProps) {
    return (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-500">
                {label}
            </p>

            <p className="mt-2 text-3xl font-black">
                {value}
            </p>
        </article>
    );
}