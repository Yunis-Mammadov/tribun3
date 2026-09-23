import { Router } from "express";
import { z } from "zod";

import {
    SESSION_COOKIE_NAME,
    clearSessionCookie,
    createAuthSession,
    deleteAuthSession,
    getAuthenticatedUser,
    setSessionCookie,
} from "../lib/auth-session.js";

import {
    hashPassword,
    verifyPassword,
} from "../lib/password.js";

import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

const registerSchema = z.object({
    email: z
        .string()
        .trim()
        .email()
        .max(254),

    username: z
        .string()
        .trim()
        .min(3)
        .max(24)
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Kullanıcı adı yalnızca harf, rakam ve _ içerebilir.",
        ),

    password: z
        .string()
        .min(8)
        .max(128),

    favoriteTeamSlug: z
        .string()
        .trim()
        .min(1),
});

const loginSchema = z.object({
    identifier: z
        .string()
        .trim()
        .min(1),

    password: z
        .string()
        .min(1),
});

authRouter.post("/auth/register", async (req, res) => {
    try {
        const body = registerSchema.safeParse(req.body);

        if (!body.success) {
            return res.status(400).json({
                success: false,
                message: "Kayıt bilgileri geçersiz.",
                errors: body.error.flatten(),
            });
        }

        const email = body.data.email.toLowerCase();
        const username = body.data.username.toLowerCase();

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email,
                    },
                    {
                        username,
                    },
                ],
            },

            select: {
                id: true,
                email: true,
                username: true,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "Bu e-posta adresi veya kullanıcı adı zaten kullanılıyor.",
            });
        }

        const team = await prisma.team.findUnique({
            where: {
                slug: body.data.favoriteTeamSlug,
            },

            select: {
                id: true,
            },
        });

        if (!team) {
            return res.status(400).json({
                success: false,
                message: "Geçerli bir takım seçmelisin.",
            });
        }

        const passwordHash = await hashPassword(
            body.data.password,
        );

        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                favoriteTeamId: team.id,
            },

            select: {
                id: true,
                email: true,
                username: true,
                role: true,

                favoriteTeam: {
                    select: {
                        slug: true,
                        name: true,
                        shortName: true,
                    },
                },
            },
        });

        const session = await createAuthSession(user.id);

        setSessionCookie(
            res,
            session.token,
            session.expiresAt,
        );

        return res.status(201).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Kayıt işlemi tamamlanamadı.",
        });
    }
});

authRouter.post("/auth/login", async (req, res) => {
    try {
        const body = loginSchema.safeParse(req.body);

        if (!body.success) {
            return res.status(400).json({
                success: false,
                message: "Giriş bilgileri geçersiz.",
            });
        }

        const identifier =
            body.data.identifier.toLowerCase();

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email: identifier,
                    },
                    {
                        username: identifier,
                    },
                ],
            },

            include: {
                favoriteTeam: {
                    select: {
                        slug: true,
                        name: true,
                        shortName: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Kullanıcı adı/e-posta veya şifre hatalı.",
            });
        }

        const passwordMatches = await verifyPassword(
            body.data.password,
            user.passwordHash,
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Kullanıcı adı/e-posta veya şifre hatalı.",
            });
        }

        const session = await createAuthSession(user.id);

        setSessionCookie(
            res,
            session.token,
            session.expiresAt,
        );

        return res.json({
            success: true,

            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                favoriteTeam: user.favoriteTeam,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Giriş yapılamadı.",
        });
    }
});

authRouter.post("/auth/logout", async (req, res) => {
    try {
        const token =
            req.cookies?.[SESSION_COOKIE_NAME];

        if (typeof token === "string") {
            await deleteAuthSession(token);
        }

        clearSessionCookie(res);

        return res.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        clearSessionCookie(res);

        return res.json({
            success: true,
        });
    }
});

authRouter.get("/auth/me", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Oturum bulunamadı.",
            });
        }

        return res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Oturum kontrol edilemedi.",
        });
    }
});