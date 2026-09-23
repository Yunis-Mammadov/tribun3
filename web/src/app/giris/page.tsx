import type { Metadata } from "next";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
    title: "Giriş Yap",
    description:
        "Tribün hesabına giriş yap ve futbol oyunlarına devam et.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function LoginPage() {
    return (
        <main className="mx-auto max-w-xl px-6 py-20">
            <p className="font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Tekrar hoş geldin
            </p>

            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                Giriş yap
            </h1>

            <p className="mt-4 leading-7 text-zinc-400">
                Hesabına giriş yap, puanlarına ulaş ve oyunlara kaldığın
                yerden devam et.
            </p>

            <div className="mt-10">
                <LoginForm />
            </div>
        </main>
    );
}