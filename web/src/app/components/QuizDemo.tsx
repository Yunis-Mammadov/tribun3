"use client";

import { useEffect, useState } from "react";

type QuizDemoProps = {
    seconds: number;
};

export default function QuizDemo({ seconds }: QuizDemoProps) {
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (!started || timeLeft <= 0) {
            return;
        }

        const timer = window.setTimeout(() => {
            setTimeLeft((current) => current - 1);
        }, 1000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [started, timeLeft]);

    function startGame() {
        setTimeLeft(seconds);
        setStarted(true);
    }

    if (!started) {
        return (
            <button
                type="button"
                onClick={startGame}
                className="rounded-xl bg-white px-6 py-3 font-bold text-black"
            >
                Oyunu başlat
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm uppercase tracking-widest text-zinc-400">
                Kalan süre
            </p>

            <p className="mt-2 text-5xl font-black text-white">
                {timeLeft}
            </p>

            {timeLeft === 0 && (
                <p className="mt-4 font-medium text-red-400">
                    Süre doldu.
                </p>
            )}
        </div>
    );
}