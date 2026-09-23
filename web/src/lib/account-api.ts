import type { AuthUser } from "./auth-api";

export type AccountStats = {
    gamesPlayed: number;
    totalScore: number;
    bestScore: number;
    correctAnswers: number;
    totalQuestions: number;
    accuracy: number;
};

export type RecentGame = {
    id: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    completedAt: string | null;

    game: {
        slug: string;
        title: string;
    };

    team: {
        slug: string;
        name: string;
    } | null;
};

export type AccountSummary = {
    success: true;
    user: AuthUser;
    stats: AccountStats;
    recentGames: RecentGame[];
};

export async function getAccountSummary() {
    const response = await fetch(
        "/api/tribun/account/summary",
        {
            cache: "no-store",
        },
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ?? "Hesap bilgileri yüklenemedi.",
        );
    }

    return data as AccountSummary;
}