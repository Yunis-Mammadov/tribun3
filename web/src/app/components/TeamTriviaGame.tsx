"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type AnswerResult,
  type QuizQuestion,
  type QuizSession,
  createQuizSession,
  getNextQuestion,
  submitQuizAnswer,
} from "@/lib/quiz-api";

const GAME_SLUG = "ne-kadar-taraftarsin";

type GameStage =
  | "idle"
  | "loading"
  | "question"
  | "feedback"
  | "completed"
  | "error";

export default function TeamTriviaGame() {
  const [stage, setStage] = useState<GameStage>("idle");

  const [session, setSession] =
    useState<QuizSession | null>(null);

  const [question, setQuestion] =
    useState<QuizQuestion | null>(null);

  const [feedback, setFeedback] =
    useState<AnswerResult | null>(null);

  const [selectedOptionId, setSelectedOptionId] =
    useState<string | null>(null);

  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const timeoutSubmittedRef = useRef(false);

  const loadNextQuestion = useCallback(
    async (sessionId: string) => {
      setStage("loading");
      setFeedback(null);
      setSelectedOptionId(null);
      timeoutSubmittedRef.current = false;

      try {
        const response = await getNextQuestion(sessionId);

        if (response.completed) {
          setSession(response.session);
          setQuestion(null);
          setStage("completed");
          return;
        }

        const serverNow = new Date(
          response.serverNow,
        ).getTime();

        const expiresAt = new Date(
          response.question.expiresAt,
        ).getTime();

        const remaining = Math.max(
          0,
          expiresAt - serverNow,
        );

        setQuestion(response.question);
        setTimeLeftMs(remaining);
        setStage("question");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Soru yüklenemedi.",
        );

        setStage("error");
      }
    },
    [],
  );

  async function startGame() {
    setStage("loading");
    setError(null);
    setQuestion(null);
    setFeedback(null);

    try {
      // Auth gelene kadar test takımımız Galatasaray.
      const response = await createQuizSession(
        GAME_SLUG,
        "galatasaray",
      );

      setSession(response.session);

      await loadNextQuestion(response.session.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Oyun başlatılamadı.",
      );

      setStage("error");
    }
  }

  const sendAnswer = useCallback(
    async (optionId: string | null) => {
      if (
        !session ||
        !question ||
        stage !== "question"
      ) {
        return;
      }

      setStage("loading");

      try {
        const response = await submitQuizAnswer(
          session.id,
          question.sessionQuestionId,
          optionId,
        );

        setSession(response.session);
        setSelectedOptionId(optionId);
        setFeedback(response.result);

        if (!response.result.hasNext) {
          setStage("completed");
          return;
        }

        setStage("feedback");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Cevap gönderilemedi.",
        );

        setStage("error");
      }
    },
    [question, session, stage],
  );

  useEffect(() => {
    if (stage !== "question" || !question) {
      return;
    }

    const initialMs = timeLeftMs;
    const localDeadline = performance.now() + initialMs;

    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        localDeadline - performance.now(),
      );

      setTimeLeftMs(remaining);
    }, 50);

    return () => {
      window.clearInterval(timer);
    };
  }, [question, stage]);

  useEffect(() => {
    if (
      stage !== "question" ||
      timeLeftMs > 0 ||
      timeoutSubmittedRef.current
    ) {
      return;
    }

    timeoutSubmittedRef.current = true;

    void sendAnswer(null);
  }, [sendAnswer, stage, timeLeftMs]);

  if (stage === "idle") {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Takımın
        </p>

        <div className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
          <p className="text-xl font-bold">
            Galatasaray
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Test aşamasında ilk soru bankası
          </p>
        </div>

        <button
          type="button"
          onClick={startGame}
          className="mt-6 w-full rounded-xl bg-white px-6 py-4 font-bold text-black transition hover:bg-zinc-200"
        >
          Oyuna başla
        </button>
      </section>
    );
  }

  if (stage === "loading") {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />

        <p className="mt-4 text-zinc-400">
          Hazırlanıyor...
        </p>
      </section>
    );
  }

  if (stage === "error") {
    return (
      <section className="rounded-3xl border border-red-950 bg-red-950/20 p-8">
        <h2 className="text-xl font-bold text-red-300">
          Bir hata oluştu
        </h2>

        <p className="mt-3 text-red-200/70">
          {error}
        </p>

        <button
          type="button"
          onClick={startGame}
          className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-black"
        >
          Tekrar dene
        </button>
      </section>
    );
  }

  if (stage === "completed" && session) {
    const accuracy =
      session.totalQuestions > 0
        ? Math.round(
            (session.correctAnswers /
              session.totalQuestions) *
              100,
          )
        : 0;

    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Oyun tamamlandı
        </p>

        <h2 className="mt-3 text-4xl font-black">
          {session.score.toLocaleString("tr-TR")} puan
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-zinc-950 p-5">
            <p className="text-sm text-zinc-500">
              Doğru cevap
            </p>

            <p className="mt-1 text-2xl font-bold">
              {session.correctAnswers}/
              {session.totalQuestions}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-5">
            <p className="text-sm text-zinc-500">
              Başarı
            </p>

            <p className="mt-1 text-2xl font-bold">
              %{accuracy}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startGame}
          className="mt-8 w-full rounded-xl bg-white px-6 py-4 font-bold text-black"
        >
          Tekrar oyna
        </button>
      </section>
    );
  }

  if (!question || !session) {
    return null;
  }

  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  const questionDurationMs =
    (session.game?.questionTimeSeconds ?? 8) * 1000;

  const progress = Math.max(
    0,
    Math.min(100, (timeLeftMs / questionDurationMs) * 100),
  );

  if (stage === "feedback" && feedback) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p
          className={`text-sm font-bold uppercase tracking-[0.2em] ${
            feedback.correct
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {feedback.timedOut
            ? "Süre doldu"
            : feedback.correct
              ? "Doğru cevap"
              : "Yanlış cevap"}
        </p>

        <h2 className="mt-4 text-3xl font-black">
          {feedback.correct
            ? `+${feedback.points.toLocaleString(
                "tr-TR",
              )} puan`
            : "0 puan"}
        </h2>

        <div className="mt-6 rounded-2xl bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">
            Doğru cevap
          </p>

          <p className="mt-2 text-lg font-bold">
            {feedback.correctOption.text}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
          <span>
            Toplam:{" "}
            {session.score.toLocaleString("tr-TR")}
          </span>

          <span>
            {session.correctAnswers}/
            {session.totalQuestions} doğru
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadNextQuestion(session.id);
          }}
          className="mt-8 w-full rounded-xl bg-white px-6 py-4 font-bold text-black"
        >
          Sonraki soru
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-400">
          Soru {question.position}/
          {session.totalQuestions}
        </p>

        <p
          className={`text-2xl font-black ${
            secondsLeft <= 2
              ? "text-red-400"
              : "text-white"
          }`}
        >
          {secondsLeft}
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-white transition-[width] duration-75"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <h2 className="mt-8 text-2xl font-bold leading-snug sm:text-3xl">
        {question.prompt}
      </h2>

      <div className="mt-8 grid gap-3">
        {question.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              void sendAnswer(option.id);
            }}
            className="flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-left transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold">
              {String.fromCharCode(65 + index)}
            </span>

            <span className="font-semibold">
              {option.text}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between text-sm text-zinc-500">
        <span>
          Puan: {session.score.toLocaleString("tr-TR")}
        </span>

        <span>
          {session.correctAnswers} doğru
        </span>
      </div>
    </section>
  );
}