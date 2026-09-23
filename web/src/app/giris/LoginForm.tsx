"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { loginUser } from "@/lib/auth-api";

export default function LoginForm() {
    const searchParams = useSearchParams();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (loading) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await loginUser({
                identifier,
                password,
            });

            const next = searchParams.get("next");

            const destination =
                next &&
                    next.startsWith("/") &&
                    !next.startsWith("//")
                    ? next
                    : "/";

            window.location.assign(destination);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Giriş yapılamadı.",
            );

            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8"
        >
            <div>
                <label
                    htmlFor="identifier"
                    className="text-sm font-semibold text-zinc-300"
                >
                    Kullanıcı adı veya e-posta
                </label>

                <input
                    id="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) =>
                        setIdentifier(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
                />
            </div>

            <div className="mt-5">
                <label
                    htmlFor="password"
                    className="text-sm font-semibold text-zinc-300"
                >
                    Şifre
                </label>

                <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
                />
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-7 w-full rounded-xl bg-white px-5 py-4 font-bold text-black disabled:opacity-50"
            >
                {loading ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
                Hesabın yok mu?{" "}
                <Link
                    href={
                        searchParams.get("next")
                            ? `/kayit?next=${encodeURIComponent(
                                searchParams.get("next")!,
                            )}`
                            : "/kayit"
                    }
                    className="font-semibold text-white"
                >
                    Kayıt ol
                </Link>
            </p>
        </form>
    );
}