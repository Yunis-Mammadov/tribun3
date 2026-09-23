"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type AuthUser,
  getCurrentUser,
} from "@/lib/auth-api";

import {
  type AnswerResult,
  type QuizQuestion,
  type QuizSession,
  createQuizSession,
  getNextQuestion,
  submitQuizAnswer,
} from "@/lib/quiz-api";

const GAME_SLUG = "ne-kadar-taraftarsin";

const LOGIN_URL =
  "/giris?next=/oyunlar/ne-kadar-taraftarsin";

const REGISTER_URL =
  "/kayit?next=/oyunlar/ne-kadar-taraftarsin";

type GameStage =
  | "idle"
  | "loading"
  | "question"
  | "feedback"
  | "completed"
  | "error";

export default function TeamTriviaGame() {
  const [stage, setStage] =
    useState<GameStage>("idle");

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [session, setSession] =
    useState<QuizSession | null>(null);

  const [question, setQuestion] =
    useState<QuizQuestion | null>(null);

  const [feedback, setFeedback] =
    useState<AnswerResult | null>(null);

  const [selectedOptionId, setSelectedOptionId] =
    useState<string | null>(null);

  const [timeLeftMs, setTimeLeftMs] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  const timeoutSubmittedRef = useRef(false);

  /*
   * Login olmuş istifadəçini yoxlayırıq.
   */
  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await getCurrentUser();

        if (active) {
          setUser(response.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Sessiyanın növbəti sualını backend-dən alır.
   */
  const loadNextQuestion = useCallback(
    async (sessionId: string) => {
      setStage("loading");
      setFeedback(null);
      setSelectedOptionId(null);
      setError(null);

      timeoutSubmittedRef.current = false;

      try {
        const response =
          await getNextQuestion(sessionId);

        /*
         * Backend artıq bütün sualların
         * tamamlandığını deyirsə nəticə ekranına keç.
         */
        if (response.completed) {
          setSession((current) => {
            if (!current) {
              return response.session;
            }

            return {
              ...current,
              ...response.session,
            };
          });

          setQuestion(null);
          setStage("completed");

          return;
        }

        /*
         * Server vaxtı əsas götürülür.
         * Browser saatına güvənmirik.
         */
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

  /*
   * Yeni oyun sessiyası yaradır.
   *
   * Komanda artıq frontend-dən göndərilmir.
   * Backend login olmuş user-in favoriteTeam
   * məlumatından özü müəyyən edir.
   */
  async function startGame() {
    if (!user) {
      return;
    }

    if (!user.favoriteTeam) {
      setError(
        "Oyuna başlamak için hesabında bir takım seçmelisin.",
      );

      setStage("error");

      return;
    }

    setStage("loading");
    setError(null);
    setQuestion(null);
    setFeedback(null);
    setSelectedOptionId(null);
    setTimeLeftMs(0);
    setSession(null);

    timeoutSubmittedRef.current = false;

    try {
      const response =
        await createQuizSession(GAME_SLUG);

      setSession(response.session);

      await loadNextQuestion(
        response.session.id,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Oyun başlatılamadı.",
      );

      setStage("error");
    }
  }

  /*
   * Cavabı backend-ə göndərir.
   *
   * optionId null olarsa bu timeout deməkdir.
   */
  const sendAnswer = useCallback(
    async (optionId: string | null) => {
      if (
        !session ||
        !question ||
        stage !== "question"
      ) {
        return;
      }

      /*
       * Double click / iki dəfə request
       * göndərilməsinin qarşısını alır.
       */
      setStage("loading");

      try {
        const response =
          await submitQuizAnswer(
            session.id,
            question.sessionQuestionId,
            optionId,
          );

        /*
         * Answer endpoint session-in yalnız
         * bəzi sahələrini qaytara bilər.
         * Mövcud game/team məlumatını itirməmək
         * üçün merge edirik.
         */
        setSession((current) => {
          if (!current) {
            return response.session;
          }

          return {
            ...current,
            ...response.session,
          };
        });

        setSelectedOptionId(optionId);
        setFeedback(response.result);

        /*
         * Son sualdırsa birbaşa nəticə ekranı.
         */
        if (!response.result.hasNext) {
          setQuestion(null);
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

  /*
   * Client-side vizual timer.
   *
   * Real deadline backend-də saxlanılır.
   */
  useEffect(() => {
    if (
      stage !== "question" ||
      !question
    ) {
      return;
    }

    const initialMs = timeLeftMs;

    const localDeadline =
      performance.now() + initialMs;

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

    /*
     * timeLeftMs dependency-yə qəsdən
     * əlavə olunmur. Əks halda timer hər
     * tick-də yenidən başlayardı.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, stage]);

  /*
   * Vaxt sıfıra düşdükdə avtomatik
   * timeout cavabı göndəririk.
   */
  useEffect(() => {
    if (
      stage !== "question" ||
      !question ||
      timeLeftMs > 0 ||
      timeoutSubmittedRef.current
    ) {
      return;
    }

    timeoutSubmittedRef.current = true;

    void sendAnswer(null);
  }, [
    question,
    sendAnswer,
    stage,
    timeLeftMs,
  ]);

  /*
   * 1. İlk ekran
   */
  if (stage === "idle") {
    if (authLoading) {
      return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />

          <p className="mt-4 text-zinc-400">
            Hesap kontrol ediliyor...
          </p>
        </section>
      );
    }

    /*
     * Login olunmayıb.
     */
    if (!user) {
      return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Oynamaya hazır mısın?
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Önce hesabına giriş yap
          </h2>

          <p className="mt-3 leading-7 text-zinc-400">
            Ne Kadar Taraftarsın? seçtiğin
            takıma özel sorularla oynanır.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={LOGIN_URL}
              className="rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
            >
              Giriş yap
            </Link>

            <Link
              href={REGISTER_URL}
              className="rounded-xl border border-zinc-700 px-5 py-3 font-bold transition hover:border-zinc-500"
            >
              Kayıt ol
            </Link>
          </div>
        </section>
      );
    }

    /*
     * Login olunub.
     */
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Takımın
        </p>

        <div className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
          <p className="text-xl font-bold">
            {user.favoriteTeam?.name ??
              "Takım seçilmedi"}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Sorular bu takıma göre
            hazırlanacak.
          </p>
        </div>

        <button
          type="button"
          disabled={!user.favoriteTeam}
          onClick={() => {
            void startGame();
          }}
          className="mt-6 w-full rounded-xl bg-white px-6 py-4 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Oyuna başla
        </button>
      </section>
    );
  }

  /*
   * 2. Loading
   *
   * BU CHECK question/session null
   * check-indən əvvəl gəlməlidir.
   */
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

  /*
   * 3. Error
   */
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
          onClick={() => {
            setStage("idle");
            setError(null);
          }}
          className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
        >
          Geri dön
        </button>
      </section>
    );
  }

  /*
   * 4. Completed
   */
  if (
    stage === "completed" &&
    session
  ) {
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
          {session.score.toLocaleString(
            "tr-TR",
          )}{" "}
          puan
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
          onClick={() => {
            void startGame();
          }}
          className="mt-8 w-full rounded-xl bg-white px-6 py-4 font-bold text-black transition hover:bg-zinc-200"
        >
          Tekrar oyna
        </button>
      </section>
    );
  }

  /*
   * Bundan sonra question və session
   * mütləq olmalıdır.
   */
  if (!question || !session) {
    return null;
  }

  const secondsLeft = Math.ceil(
    timeLeftMs / 1000,
  );

  const questionDurationMs =
    (session.game?.questionTimeSeconds ??
      8) * 1000;

  const progress = Math.max(
    0,
    Math.min(
      100,
      (timeLeftMs / questionDurationMs) *
      100,
    ),
  );

  /*
   * 5. Cavab feedback ekranı
   */
  if (
    stage === "feedback" &&
    feedback
  ) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p
          className={`text-sm font-bold uppercase tracking-[0.2em] ${feedback.correct
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

        {selectedOptionId && (
          <p className="mt-4 text-sm text-zinc-500">
            Cevabın kaydedildi.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-zinc-400">
          <span>
            Toplam:{" "}
            {session.score.toLocaleString(
              "tr-TR",
            )}
          </span>

          <span>
            {session.correctAnswers}/
            {session.totalQuestions} doğru
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadNextQuestion(
              session.id,
            );
          }}
          className="mt-8 w-full rounded-xl bg-white px-6 py-4 font-bold text-black transition hover:bg-zinc-200"
        >
          Sonraki soru
        </button>
      </section>
    );
  }

  /*
   * 6. Aktiv sual
   */
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-zinc-400">
          Soru {question.position}/
          {session.totalQuestions}
        </p>

        <p
          className={`text-2xl font-black ${secondsLeft <= 2
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
        {question.options.map(
          (option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                void sendAnswer(
                  option.id,
                );
              }}
              className="flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-left transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold">
                {String.fromCharCode(
                  65 + index,
                )}
              </span>

              <span className="font-semibold">
                {option.text}
              </span>
            </button>
          ),
        )}
      </div>

      <div className="mt-6 flex justify-between gap-4 text-sm text-zinc-500">
        <span>
          Puan:{" "}
          {session.score.toLocaleString(
            "tr-TR",
          )}
        </span>

        <span>
          {session.correctAnswers} doğru
        </span>
      </div>
    </section>
  );
}