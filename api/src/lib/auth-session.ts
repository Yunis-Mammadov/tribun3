import {
    createHash,
    randomBytes,
} from "node:crypto";

import type {
    Request,
    Response,
} from "express";

import { prisma } from "./prisma.js";

export const SESSION_COOKIE_NAME = "tribun_session";

const SESSION_DURATION_MS =
    1000 * 60 * 60 * 24 * 30; // 30 days

function hashToken(token: string): string {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

export async function createAuthSession(
    userId: string,
) {
    const token = randomBytes(32).toString("base64url");

    const tokenHash = hashToken(token);

    const expiresAt = new Date(
        Date.now() + SESSION_DURATION_MS,
    );

    await prisma.authSession.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });

    return {
        token,
        expiresAt,
    };
}

export function setSessionCookie(
    res: Response,
    token: string,
    expiresAt: Date,
) {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
}

export function clearSessionCookie(
    res: Response,
) {
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}

export async function deleteAuthSession(
    token: string,
) {
    const tokenHash = hashToken(token);

    await prisma.authSession.deleteMany({
        where: {
            tokenHash,
        },
    });
}

export async function getAuthenticatedUser(
    req: Request,
) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (
        typeof token !== "string" ||
        token.length === 0
    ) {
        return null;
    }

    const tokenHash = hashToken(token);

    const session = await prisma.authSession.findUnique({
        where: {
            tokenHash,
        },

        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    role: true,

                    favoriteTeam: {
                        select: {
                            id: true,
                            slug: true,
                            name: true,
                            shortName: true,
                            logoUrl: true,
                        },
                    },
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
        await prisma.authSession.delete({
            where: {
                id: session.id,
            },
        });

        return null;
    }

    return session.user;
}