import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";

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

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        service: "tribun-api",
    });
});

app.get("/api/games", (_req, res) => {
    res.json({
        games: [
            {
                slug: "ne-kadar-taraftarsin",
                title: "Ne Kadar Taraftarsın?",
                description:
                    "Tuttuğun takımı ne kadar iyi tanıdığını zamana karşı test et.",
                questionCount: 10,
                secondsPerQuestion: 8,
            },
            {
                slug: "golu-kim-atmisti",
                title: "Golü Kim Atmıştı?",
                description:
                    "Unutulmaz derbileri hatırla ve golleri atan futbolcuları bul.",
                questionCount: 10,
                secondsPerQuestion: 10,
            },
        ],
    });
});

app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint bulunamadı.",
    });
});

app.listen(PORT, () => {
    console.log(`Tribün API: http://localhost:${PORT}`);
});