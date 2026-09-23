import { Router } from "express";

import { SessionStatus } from "../generated/prisma/client.js";
import { getAuthenticatedUser } from "../lib/auth-session.js";
import { prisma } from "../lib/prisma.js";

export const accountRouter = Router();

accountRouter.get("/account/summary", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Bu sayfayı görüntülemek için giriş yapmalısın.",
            });
        }

        const [stats, recentGames] = await Promise.all([
            prisma.gameSession.aggregate({
                where: {
                    userId: user.id,
                    status: SessionStatus.COMPLETED,
                },

                _count: {
                    id: true,
                },

                _sum: {
                    score: true,
                    correctAnswers: true,
                    totalQuestions: true,
                },

                _max: {
                    score: true,
                },
            }),

            prisma.gameSession.findMany({
                where: {
                    userId: user.id,
                    status: SessionStatus.COMPLETED,
                },

                orderBy: {
                    completedAt: "desc",
                },

                take: 5,

                select: {
                    id: true,
                    score: true,
                    correctAnswers: true,
                    totalQuestions: true,
                    completedAt: true,

                    game: {
                        select: {
                            slug: true,
                            title: true,
                        },
                    },

                    team: {
                        select: {
                            slug: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

        const totalCorrectAnswers =
            stats._sum.correctAnswers ?? 0;

        const totalQuestions =
            stats._sum.totalQuestions ?? 0;

        const accuracy =
            totalQuestions > 0
                ? Math.round(
                    (totalCorrectAnswers / totalQuestions) * 100,
                )
                : 0;

        return res.json({
            success: true,

            user,

            stats: {
                gamesPlayed: stats._count.id,
                totalScore: stats._sum.score ?? 0,
                bestScore: stats._max.score ?? 0,
                correctAnswers: totalCorrectAnswers,
                totalQuestions,
                accuracy,
            },

            recentGames,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Hesap bilgileri yüklenemedi.",
        });
    }
});