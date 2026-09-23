import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { prisma } from "./lib/prisma.js";
import { quizRouter } from "./routes/quiz.routes.js";

const app = express();

const PORT = Number(process.env.PORT ?? 4000);

const allowedOrigins = (
  process.env.CORS_ORIGIN ?? "http://localhost:3000"
).split(",");

app.use(helmet());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);


app.use(express.json({ limit: "1mb" }));

app.use("/api", quizRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      service: "tribun-api",
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(503).json({
      success: false,
      service: "tribun-api",
      database: "disconnected",
    });
  }
});

app.get("/api/games", async (_req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: "PUBLISHED",
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        slug: true,
        title: true,
        description: true,
        type: true,
        questionsPerSession: true,
        questionTimeSeconds: true,
      },
    });

    res.json({
      games: games.map((game) => ({
        slug: game.slug,
        title: game.title,
        description: game.description,
        type: game.type,
        questionCount: game.questionsPerSession,
        secondsPerQuestion: game.questionTimeSeconds,
      })),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Oyunlar yüklenirken bir hata oluştu.",
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint bulunamadı.",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Tribün API: http://localhost:${PORT}`);
});

async function shutdown() {
  console.log("Tribün API shutting down...");

  await prisma.$disconnect();

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);