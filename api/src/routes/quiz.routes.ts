import { randomInt } from "node:crypto";

import { Router } from "express";
import { z } from "zod";

import {
    GameStatus,
    GameType,
    SessionStatus,
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export const quizRouter = Router();

const createSessionSchema = z.object({
    teamSlug: z.string().trim().min(1).optional(),
});

const answerSchema = z.object({
    sessionQuestionId: z.string().uuid(),
    optionId: z.string().uuid().nullable(),
});

function shuffle<T>(items: T[]): T[] {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = randomInt(i + 1);

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function calculatePoints(
    startedAt: Date,
    expiresAt: Date,
    answeredAt: Date,
): number {
    const totalTimeMs = expiresAt.getTime() - startedAt.getTime();
    const elapsedMs = answeredAt.getTime() - startedAt.getTime();

    const remainingRatio = Math.max(
        0,
        Math.min(1, 1 - elapsedMs / totalTimeMs),
    );

    const basePoints = 1000;
    const maxSpeedBonus = 500;

    return basePoints + Math.round(maxSpeedBonus * remainingRatio);
}

/**
 * Yeni oyun sessiyası yaradır.
 */
quizRouter.post("/games/:slug/sessions", async (req, res) => {
    try {
        const body = createSessionSchema.safeParse(req.body);

        if (!body.success) {
            return res.status(400).json({
                success: false,
                message: "Geçersiz istek.",
            });
        }

        const game = await prisma.game.findUnique({
            where: {
                slug: req.params.slug,
            },
        });

        if (!game || game.status !== GameStatus.PUBLISHED) {
            return res.status(404).json({
                success: false,
                message: "Oyun bulunamadı.",
            });
        }

        let teamId: string | null = null;

        if (game.type === GameType.TEAM_TRIVIA) {
            if (!body.data.teamSlug) {
                return res.status(400).json({
                    success: false,
                    message: "Bu oyun için takım seçimi zorunludur.",
                });
            }

            const team = await prisma.team.findUnique({
                where: {
                    slug: body.data.teamSlug,
                },
            });

            if (!team) {
                return res.status(404).json({
                    success: false,
                    message: "Takım bulunamadı.",
                });
            }

            teamId = team.id;
        }

        const availableQuestions = await prisma.question.findMany({
            where: {
                gameId: game.id,
                teamId,
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        if (availableQuestions.length < game.questionsPerSession) {
            return res.status(409).json({
                success: false,
                message: "Bu oyun için yeterli aktif soru bulunmuyor.",
                availableQuestions: availableQuestions.length,
                requiredQuestions: game.questionsPerSession,
            });
        }

        const selectedQuestions = shuffle(availableQuestions).slice(
            0,
            game.questionsPerSession,
        );

        const session = await prisma.gameSession.create({
            data: {
                gameId: game.id,
                teamId,
                totalQuestions: game.questionsPerSession,

                questions: {
                    create: selectedQuestions.map((question, index) => ({
                        questionId: question.id,
                        position: index + 1,
                    })),
                },
            },

            select: {
                id: true,
                status: true,
                score: true,
                correctAnswers: true,
                totalQuestions: true,
                startedAt: true,

                game: {
                    select: {
                        slug: true,
                        title: true,
                        questionTimeSeconds: true,
                    },
                },

                team: {
                    select: {
                        slug: true,
                        name: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            session,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Oyun oturumu oluşturulamadı.",
        });
    }
});

/**
 * Cari sualı başladır və ya aktiv sualı qaytarır.
 */
quizRouter.post(
    "/sessions/:sessionId/questions/next",
    async (req, res) => {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const session = await tx.gameSession.findUnique({
                    where: {
                        id: req.params.sessionId,
                    },

                    include: {
                        game: {
                            select: {
                                questionTimeSeconds: true,
                            },
                        },
                    },
                });

                if (!session) {
                    return {
                        type: "not_found" as const,
                    };
                }

                if (session.status !== SessionStatus.IN_PROGRESS) {
                    return {
                        type: "finished" as const,
                        session,
                    };
                }

                const now = new Date();

                const activeQuestion = await tx.sessionQuestion.findFirst({
                    where: {
                        sessionId: session.id,
                        answeredAt: null,
                        startedAt: {
                            not: null,
                        },
                    },

                    orderBy: {
                        position: "asc",
                    },

                    include: {
                        question: {
                            select: {
                                prompt: true,
                                metadata: true,

                                options: {
                                    orderBy: {
                                        sortOrder: "asc",
                                    },

                                    select: {
                                        id: true,
                                        text: true,
                                        sortOrder: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (
                    activeQuestion &&
                    activeQuestion.expiresAt &&
                    activeQuestion.expiresAt.getTime() > now.getTime()
                ) {
                    return {
                        type: "question" as const,
                        question: activeQuestion,
                        serverNow: now,
                    };
                }

                // Aktiv sualın vaxtı bitibsə yanlış olaraq qeyd edirik.
                if (activeQuestion) {
                    const responseTimeMs = activeQuestion.startedAt
                        ? now.getTime() - activeQuestion.startedAt.getTime()
                        : null;

                    await tx.sessionQuestion.update({
                        where: {
                            id: activeQuestion.id,
                        },
                        data: {
                            answeredAt: now,
                            responseTimeMs,
                            isCorrect: false,
                            points: 0,
                        },
                    });
                }

                const nextQuestion = await tx.sessionQuestion.findFirst({
                    where: {
                        sessionId: session.id,
                        answeredAt: null,
                    },

                    orderBy: {
                        position: "asc",
                    },
                });

                if (!nextQuestion) {
                    const completedSession = await tx.gameSession.update({
                        where: {
                            id: session.id,
                        },
                        data: {
                            status: SessionStatus.COMPLETED,
                            completedAt: now,
                        },
                    });

                    return {
                        type: "completed" as const,
                        session: completedSession,
                    };
                }

                const expiresAt = new Date(
                    now.getTime() + session.game.questionTimeSeconds * 1000,
                );

                const startedQuestion = await tx.sessionQuestion.update({
                    where: {
                        id: nextQuestion.id,
                    },

                    data: {
                        startedAt: now,
                        expiresAt,
                    },

                    select: {
                        id: true,
                        position: true,
                        expiresAt: true,

                        question: {
                            select: {
                                prompt: true,
                                metadata: true,

                                options: {
                                    orderBy: {
                                        sortOrder: "asc",
                                    },

                                    select: {
                                        id: true,
                                        text: true,
                                        sortOrder: true,
                                    },
                                },
                            },
                        },
                    },
                });

                return {
                    type: "question" as const,
                    question: startedQuestion,
                    serverNow: now,
                };
            });

            if (result.type === "not_found") {
                return res.status(404).json({
                    success: false,
                    message: "Oyun oturumu bulunamadı.",
                });
            }

            if (result.type === "finished") {
                return res.status(409).json({
                    success: false,
                    message: "Bu oyun oturumu artık aktif değil.",
                });
            }

            if (result.type === "completed") {
                return res.json({
                    success: true,
                    completed: true,
                    session: {
                        id: result.session.id,
                        score: result.session.score,
                        correctAnswers: result.session.correctAnswers,
                        totalQuestions: result.session.totalQuestions,
                    },
                });
            }

            return res.json({
                success: true,
                completed: false,
                serverNow: result.serverNow,

                question: {
                    sessionQuestionId: result.question.id,
                    position: result.question.position,
                    expiresAt: result.question.expiresAt,
                    prompt: result.question.question.prompt,
                    metadata: result.question.question.metadata,
                    options: result.question.question.options,
                },
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Soru yüklenirken bir hata oluştu.",
            });
        }
    },
);

/**
 * Cavabı yoxlayır.
 */
quizRouter.post(
    "/sessions/:sessionId/answers",
    async (req, res) => {
        try {
            const body = answerSchema.safeParse(req.body);

            if (!body.success) {
                return res.status(400).json({
                    success: false,
                    message: "Geçersiz cevap.",
                });
            }

            const result = await prisma.$transaction(async (tx) => {
                const session = await tx.gameSession.findUnique({
                    where: {
                        id: req.params.sessionId,
                    },
                });

                if (!session) {
                    return {
                        type: "not_found" as const,
                    };
                }

                if (session.status !== SessionStatus.IN_PROGRESS) {
                    return {
                        type: "finished" as const,
                    };
                }

                const currentQuestion = await tx.sessionQuestion.findFirst({
                    where: {
                        sessionId: session.id,
                        answeredAt: null,
                        startedAt: {
                            not: null,
                        },
                    },

                    orderBy: {
                        position: "asc",
                    },
                });

                if (!currentQuestion) {
                    return {
                        type: "no_active_question" as const,
                    };
                }

                if (currentQuestion.id !== body.data.sessionQuestionId) {
                    return {
                        type: "wrong_question" as const,
                    };
                }

                const now = new Date();

                const isExpired =
                    !currentQuestion.expiresAt ||
                    now.getTime() > currentQuestion.expiresAt.getTime();

                let selectedOption:
                    | {
                        id: string;
                        text: string;
                        isCorrect: boolean;
                    }
                    | null = null;

                if (body.data.optionId) {
                    selectedOption = await tx.questionOption.findFirst({
                        where: {
                            id: body.data.optionId,
                            questionId: currentQuestion.questionId,
                        },

                        select: {
                            id: true,
                            text: true,
                            isCorrect: true,
                        },
                    });

                    if (!selectedOption) {
                        return {
                            type: "invalid_option" as const,
                        };
                    }
                }

                const correctOption = await tx.questionOption.findFirstOrThrow({
                    where: {
                        questionId: currentQuestion.questionId,
                        isCorrect: true,
                    },

                    select: {
                        id: true,
                        text: true,
                    },
                });

                const isCorrect =
                    !isExpired && selectedOption?.isCorrect === true;

                const responseTimeMs = currentQuestion.startedAt
                    ? now.getTime() - currentQuestion.startedAt.getTime()
                    : null;

                const points =
                    isCorrect &&
                        currentQuestion.startedAt &&
                        currentQuestion.expiresAt
                        ? calculatePoints(
                            currentQuestion.startedAt,
                            currentQuestion.expiresAt,
                            now,
                        )
                        : 0;

                const updateResult = await tx.sessionQuestion.updateMany({
                    where: {
                        id: currentQuestion.id,
                        answeredAt: null,
                    },

                    data: {
                        selectedOptionId: selectedOption?.id ?? null,
                        answeredAt: now,
                        responseTimeMs,
                        isCorrect,
                        points,
                    },
                });

                if (updateResult.count !== 1) {
                    return {
                        type: "already_answered" as const,
                    };
                }

                const updatedSession = await tx.gameSession.update({
                    where: {
                        id: session.id,
                    },

                    data: {
                        score: {
                            increment: points,
                        },

                        correctAnswers: {
                            increment: isCorrect ? 1 : 0,
                        },
                    },

                    select: {
                        id: true,
                        score: true,
                        correctAnswers: true,
                        totalQuestions: true,
                    },
                });

                const remainingQuestions = await tx.sessionQuestion.count({
                    where: {
                        sessionId: session.id,
                        answeredAt: null,
                    },
                });

                const hasNext = remainingQuestions > 0;

                if (!hasNext) {
                    await tx.gameSession.update({
                        where: {
                            id: session.id,
                        },

                        data: {
                            status: SessionStatus.COMPLETED,
                            completedAt: now,
                        },
                    });
                }

                return {
                    type: "answered" as const,
                    isCorrect,
                    isExpired,
                    points,
                    responseTimeMs,
                    correctOption,
                    hasNext,
                    session: updatedSession,
                };
            });

            switch (result.type) {
                case "not_found":
                    return res.status(404).json({
                        success: false,
                        message: "Oyun oturumu bulunamadı.",
                    });

                case "finished":
                    return res.status(409).json({
                        success: false,
                        message: "Bu oyun oturumu artık aktif değil.",
                    });

                case "no_active_question":
                    return res.status(409).json({
                        success: false,
                        message: "Önce sıradaki soruyu başlatmalısın.",
                    });

                case "wrong_question":
                    return res.status(409).json({
                        success: false,
                        message: "Gönderilen soru aktif soru değil.",
                    });

                case "invalid_option":
                    return res.status(400).json({
                        success: false,
                        message: "Bu cevap seçeneği soruya ait değil.",
                    });

                case "already_answered":
                    return res.status(409).json({
                        success: false,
                        message: "Bu soru daha önce cevaplandı.",
                    });

                case "answered":
                    return res.json({
                        success: true,

                        result: {
                            correct: result.isCorrect,
                            timedOut: result.isExpired,
                            points: result.points,
                            responseTimeMs: result.responseTimeMs,
                            correctOption: result.correctOption,
                            hasNext: result.hasNext,
                        },

                        session: result.session,
                    });
            }
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Cevap kaydedilemedi.",
            });
        }
    },
);