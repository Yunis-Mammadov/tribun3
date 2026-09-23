"use client";

import Link from "next/link";
import {
    usePathname,
    useRouter,
} from "next/navigation";
import { useEffect, useState } from "react";

import {
    type AuthUser,
    getCurrentUser,
    logoutUser,
} from "../../lib/auth-api";

export default function AuthNav() {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [loading, setLoading] = useState(true);

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
                    setLoading(false);
                }
            }
        }

        setLoading(true);

        void loadUser();

        return () => {
            active = false;
        };
    }, [pathname]);

    async function handleLogout() {
        try {
            await logoutUser();
        } finally {
            setUser(null);

            router.push("/");
            router.refresh();
        }
    }

    if (loading) {
        return (
            <div className="h-9 w-28 animate-pulse rounded-lg bg-zinc-800" />
        );
    }

    // Login olunmayıb
    if (!user) {
        return (
            <div className="flex items-center gap-4">
                <Link
                    href="/giris"
                    className="text-sm font-medium text-zinc-300 hover:text-white"
                >
                    Giriş yap
                </Link>

                <Link
                    href="/kayit"
                    className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-200"
                >
                    Kayıt ol
                </Link>
            </div>
        );
    }

    // Login olunub
    return (
        <div className="flex items-center gap-4">
            <Link
                href="/hesabim"
                className="hidden text-sm font-medium text-zinc-300 hover:text-white sm:block"
            >
                Hesabım
            </Link>

            <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                    @{user.username}
                </p>

                {user.favoriteTeam && (
                    <p className="text-xs text-zinc-500">
                        {user.favoriteTeam.name}
                    </p>
                )}
            </div>

            <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-400 hover:text-white"
            >
                Çıkış
            </button>
        </div>
    );
}