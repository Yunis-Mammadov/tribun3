export type QuizOption = {
    id: string;
    text: string;
    sortOrder: number;
};

export type QuizQuestion = {
    sessionQuestionId: string;
    position: number;
    expiresAt: string;
    prompt: string;
    metadata: unknown;
    options: QuizOption[];
};

export type QuizSession = {
    id: string;
    status: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    startedAt?: string;

    game?: {
        slug: string;
        title: string;
        questionTimeSeconds: number;
    };

    team?: {
        slug: string;
        name: string;
    } | null;
};

export type AnswerResult = {
    correct: boolean;
    timedOut: boolean;
    points: number;
    responseTimeMs: number | null;

    correctOption: {
        id: string;
        text: string;
    };

    hasNext: boolean;
};

type ApiErrorResponse = {
    success?: false;
    message?: string;
};

export class QuizApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);

        this.name = "QuizApiError";
        this.status = status;
    }
}

async function request<T>(
    path: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(`/api/tribun${path}`, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },

        cache: "no-store",
    });

    const data = (await response.json()) as
        | T
        | ApiErrorResponse;

    if (!response.ok) {
        const error = data as ApiErrorResponse;

        throw new QuizApiError(
            error.message ?? "Beklenmeyen bir hata oluştu.",
            response.status,
        );
    }

    return data as T;
}

export async function createQuizSession(
    gameSlug: string,
) {
    return request<{
        success: true;
        session: QuizSession;
    }>(`/games/${gameSlug}/sessions`, {
        method: "POST",
        body: JSON.stringify({}),
    });
}

export async function getNextQuestion(
    sessionId: string,
) {
    return request<
        | {
            success: true;
            completed: false;
            serverNow: string;
            question: QuizQuestion;
        }
        | {
            success: true;
            completed: true;
            session: QuizSession;
        }
    >(`/sessions/${sessionId}/questions/next`, {
        method: "POST",
    });
}

export async function submitQuizAnswer(
    sessionId: string,
    sessionQuestionId: string,
    optionId: string | null,
) {
    return request<{
        success: true;
        result: AnswerResult;
        session: QuizSession;
    }>(`/sessions/${sessionId}/answers`, {
        method: "POST",

        body: JSON.stringify({
            sessionQuestionId,
            optionId,
        }),
    });
}