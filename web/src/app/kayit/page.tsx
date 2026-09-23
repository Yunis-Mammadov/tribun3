import type { Metadata } from "next";

import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
    title: "Kayıt Ol",
    description:
        "Tribün'e katıl, takımını seç ve futbol bilgini test et.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function RegisterPage() {
    return (
        <main className="mx-auto max-w-xl px-6 py-20">
            <p className="font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Tribün&apos;e katıl
            </p>

            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                Hesabını oluştur
            </h1>

            <p className="mt-4 leading-7 text-zinc-400">
                Takımını seç, oyunlara katıl ve puanlarını diğer taraftarlarla
                karşılaştır.
            </p>

            <div className="mt-10">
                <RegisterForm />
            </div>
        </main>
    );
}