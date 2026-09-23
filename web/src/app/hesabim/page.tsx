import type { Metadata } from "next";

import AccountDashboard from "./AccountDashboard";

export const metadata: Metadata = {
    title: "Hesabım",

    robots: {
        index: false,
        follow: false,
    },
};

export default function AccountPage() {
    return (
        <main className="mx-auto max-w-6xl px-6 py-16">
            <AccountDashboard />
        </main>
    );
}