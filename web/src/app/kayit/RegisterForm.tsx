"use client";

import Link from "next/link";
import {
    useRouter,
    useSearchParams,
} from "next/navigation"; import {
    type FormEvent,
    useEffect,
    useState,
} from "react";

import {
    type Team,
    getTeams,
    registerUser,
} from "@/lib/auth-api";

export default function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [teams, setTeams] = useState<Team[]>([]);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [favoriteTeamSlug, setFavoriteTeamSlug] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTeams() {
            try {
                const response = await getTeams();

                setTeams(response.teams);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Takımlar yüklenemedi.",
                );
            } finally {
                setTeamsLoading(false);
            }
        }

        void loadTeams();
    }, []);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setLoading(true);
        setError(null);

        try {
            await registerUser({
                email,
                username,
                password,
                favoriteTeamSlug,
            });

            const next = searchParams.get("next");

            const destination =
                next && next.startsWith("/") && !next.startsWith("//")
                    ? next
                    : "/";

            router.push(destination);
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Kayıt oluşturulamadı.",
            );
        } finally {
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
                    htmlFor="email"
                    className="text-sm font-semibold text-zinc-300"
                >
                    E-posta
                </label>

                <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                    placeholder="ornek@email.com"
                />
            </div>

            <div className="mt-5">
                <label
                    htmlFor="username"
                    className="text-sm font-semibold text-zinc-300"
                >
                    Kullanıcı adı
                </label>

                <input
                    id="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={24}
                    autoComplete="username"
                    value={username}
                    onChange={(event) => {
                        setUsername(event.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                    placeholder="yunis"
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
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                    placeholder="En az 8 karakter"
                />
            </div>

            <div className="mt-5">
                <label
                    htmlFor="team"
                    className="text-sm font-semibold text-zinc-300"
                >
                    Takımın
                </label>

                <select
                    id="team"
                    required
                    disabled={teamsLoading}
                    value={favoriteTeamSlug}
                    onChange={(event) => {
                        setFavoriteTeamSlug(event.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                >
                    <option value="">
                        {teamsLoading
                            ? "Takımlar yükleniyor..."
                            : "Takımını seç"}
                    </option>

                    {teams.map((team) => (
                        <option
                            key={team.slug}
                            value={team.slug}
                        >
                            {team.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={
                    loading ||
                    teamsLoading ||
                    !favoriteTeamSlug
                }
                className="mt-7 w-full rounded-xl bg-white px-5 py-4 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading
                    ? "Hesap oluşturuluyor..."
                    : "Kayıt ol"}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
                Zaten hesabın var?{" "}
                <Link
                    href={
                        searchParams.get("next")
                            ? `/giris?next=${encodeURIComponent(
                                searchParams.get("next")!,
                            )}`
                            : "/giris"
                    }
                >
                    Giriş yap
                </Link>
            </p>
        </form>
    );
}