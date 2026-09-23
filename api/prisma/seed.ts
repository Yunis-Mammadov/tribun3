import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
    Difficulty,
    GameStatus,
    GameType,
    PrismaClient,
} from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
}

const adapter = new PrismaPg({
    connectionString,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    await prisma.team.createMany({
        data: [
            {
                slug: "galatasaray",
                name: "Galatasaray",
                shortName: "GS",
            },
            {
                slug: "fenerbahce",
                name: "Fenerbahçe",
                shortName: "FB",
            },
            {
                slug: "besiktas",
                name: "Beşiktaş",
                shortName: "BJK",
            },
            {
                slug: "trabzonspor",
                name: "Trabzonspor",
                shortName: "TS",
            },
        ],
        skipDuplicates: true,
    });

    const teamTriviaGame = await prisma.game.upsert({
        where: {
            slug: "ne-kadar-taraftarsin",
        },
        update: {
            title: "Ne Kadar Taraftarsın?",
            description:
                "Tuttuğun takımı ne kadar iyi tanıdığını zamana karşı test et.",
            type: GameType.TEAM_TRIVIA,
            status: GameStatus.PUBLISHED,
            questionsPerSession: 10,
            questionTimeSeconds: 8,
        },
        create: {
            slug: "ne-kadar-taraftarsin",
            title: "Ne Kadar Taraftarsın?",
            description:
                "Tuttuğun takımı ne kadar iyi tanıdığını zamana karşı test et.",
            type: GameType.TEAM_TRIVIA,
            status: GameStatus.PUBLISHED,
            questionsPerSession: 10,
            questionTimeSeconds: 8,
            publishedAt: new Date(),
        },
    });

    await prisma.game.upsert({
        where: {
            slug: "golu-kim-atmisti",
        },
        update: {
            title: "Golü Kim Atmıştı?",
            description:
                "Unutulmaz derbileri hatırla ve golleri atan futbolcuları bul.",
            type: GameType.WHO_SCORED,
            status: GameStatus.PUBLISHED,
            questionsPerSession: 10,
            questionTimeSeconds: 10,
        },
        create: {
            slug: "golu-kim-atmisti",
            title: "Golü Kim Atmıştı?",
            description:
                "Unutulmaz derbileri hatırla ve golleri atan futbolcuları bul.",
            type: GameType.WHO_SCORED,
            status: GameStatus.PUBLISHED,
            questionsPerSession: 10,
            questionTimeSeconds: 10,
            publishedAt: new Date(),
        },
    });

    const galatasaray = await prisma.team.findUniqueOrThrow({
        where: {
            slug: "galatasaray",
        },
    });

    const questions = [
        {
            code: "gs-founded-year",
            prompt: "Galatasaray hangi yılda kuruldu?",
            explanation: "Galatasaray Spor Kulübü 1905 yılında kuruldu.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "1903", isCorrect: false },
                { text: "1905", isCorrect: true },
                { text: "1907", isCorrect: false },
                { text: "1910", isCorrect: false },
            ],
        },
        {
            code: "gs-founder",
            prompt: "Galatasaray'ın kurucusu kimdir?",
            explanation:
                "Galatasaray'ın kurucuları arasında yer alan Ali Sami Yen kulübün ilk başkanıdır.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "Ali Sami Yen", isCorrect: true },
                { text: "Metin Oktay", isCorrect: false },
                { text: "Gündüz Kılıç", isCorrect: false },
                { text: "Tevfik Fikret", isCorrect: false },
            ],
        },
        {
            code: "gs-colors",
            prompt: "Galatasaray'ın geleneksel renkleri hangileridir?",
            explanation: "Galatasaray'ın renkleri sarı ve kırmızıdır.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "Sarı - Kırmızı", isCorrect: true },
                { text: "Sarı - Lacivert", isCorrect: false },
                { text: "Siyah - Beyaz", isCorrect: false },
                { text: "Bordo - Mavi", isCorrect: false },
            ],
        },
        {
            code: "gs-uefa-year",
            prompt: "Galatasaray UEFA Kupası'nı hangi yıl kazandı?",
            explanation: "Galatasaray UEFA Kupası'nı 2000 yılında kazandı.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "1998", isCorrect: false },
                { text: "1999", isCorrect: false },
                { text: "2000", isCorrect: true },
                { text: "2001", isCorrect: false },
            ],
        },
        {
            code: "gs-uefa-final-opponent",
            prompt: "Galatasaray 2000 UEFA Kupası finalinde hangi takımla karşılaştı?",
            explanation:
                "Galatasaray finalde Arsenal ile karşılaştı ve kupayı penaltılarla kazandı.",
            difficulty: Difficulty.MEDIUM,
            options: [
                { text: "Arsenal", isCorrect: true },
                { text: "Chelsea", isCorrect: false },
                { text: "Liverpool", isCorrect: false },
                { text: "Leeds United", isCorrect: false },
            ],
        },
        {
            code: "gs-super-cup-opponent",
            prompt:
                "Galatasaray 2000 UEFA Süper Kupa maçında hangi takımı mağlup etti?",
            explanation:
                "Galatasaray UEFA Süper Kupa'da Real Madrid'i mağlup etti.",
            difficulty: Difficulty.MEDIUM,
            options: [
                { text: "Barcelona", isCorrect: false },
                { text: "Real Madrid", isCorrect: true },
                { text: "Manchester United", isCorrect: false },
                { text: "Bayern Münih", isCorrect: false },
            ],
        },
        {
            code: "gs-metin-oktay-nickname",
            prompt: "Metin Oktay'ın bilinen lakabı nedir?",
            explanation: "Metin Oktay, 'Taçsız Kral' lakabıyla anılır.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "İmparator", isCorrect: false },
                { text: "Taçsız Kral", isCorrect: true },
                { text: "Kral", isCorrect: false },
                { text: "Büyük Kaptan", isCorrect: false },
            ],
        },
        {
            code: "gs-hagi-country",
            prompt: "Gheorghe Hagi hangi ülkenin futbolcusudur?",
            explanation: "Gheorghe Hagi Romanyalıdır.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "Bulgaristan", isCorrect: false },
                { text: "Macaristan", isCorrect: false },
                { text: "Romanya", isCorrect: true },
                { text: "Sırbistan", isCorrect: false },
            ],
        },
        {
            code: "gs-founded-school",
            prompt: "Galatasaray hangi okulun öğrencileri tarafından kuruldu?",
            explanation:
                "Kulüp Galatasaray Lisesi öğrencileri tarafından kuruldu.",
            difficulty: Difficulty.MEDIUM,
            options: [
                { text: "Galatasaray Lisesi", isCorrect: true },
                { text: "İstanbul Erkek Lisesi", isCorrect: false },
                { text: "Kabataş Erkek Lisesi", isCorrect: false },
                { text: "Robert Koleji", isCorrect: false },
            ],
        },
        {
            code: "gs-symbol",
            prompt: "Galatasaray ile özdeşleşen hayvan hangisidir?",
            explanation: "Galatasaray ile özdeşleşen sembol aslandır.",
            difficulty: Difficulty.EASY,
            options: [
                { text: "Kartal", isCorrect: false },
                { text: "Kanarya", isCorrect: false },
                { text: "Kaplan", isCorrect: false },
                { text: "Aslan", isCorrect: true },
            ],
        },
        {
            code: "gs-uefa-final-result",
            prompt:
                "Galatasaray 2000 UEFA Kupası finalini hangi yöntemle kazandı?",
            explanation:
                "Final 0-0 sona erdi ve Galatasaray penaltı atışlarında kazandı.",
            difficulty: Difficulty.MEDIUM,
            options: [
                { text: "Normal sürede", isCorrect: false },
                { text: "Uzatmalarda", isCorrect: false },
                { text: "Penaltı atışlarında", isCorrect: true },
                { text: "Altın golle", isCorrect: false },
            ],
        },
        {
            code: "gs-super-cup-jardel",
            prompt:
                "Galatasaray'ın 2000 UEFA Süper Kupa zaferinde golleri atan futbolcu kimdi?",
            explanation:
                "Real Madrid karşısındaki iki golü de Mário Jardel attı.",
            difficulty: Difficulty.HARD,
            options: [
                { text: "Gheorghe Hagi", isCorrect: false },
                { text: "Mário Jardel", isCorrect: true },
                { text: "Ümit Davala", isCorrect: false },
                { text: "Hasan Şaş", isCorrect: false },
            ],
        },
    ];

    for (const question of questions) {
        const dbQuestion = await prisma.question.upsert({
            where: {
                code: question.code,
            },

            update: {
                gameId: teamTriviaGame.id,
                teamId: galatasaray.id,
                prompt: question.prompt,
                explanation: question.explanation,
                difficulty: question.difficulty,
                isActive: true,
            },

            create: {
                code: question.code,
                gameId: teamTriviaGame.id,
                teamId: galatasaray.id,
                prompt: question.prompt,
                explanation: question.explanation,
                difficulty: question.difficulty,
                isActive: true,
            },
        });

        for (const [index, option] of question.options.entries()) {
            await prisma.questionOption.upsert({
                where: {
                    questionId_sortOrder: {
                        questionId: dbQuestion.id,
                        sortOrder: index,
                    },
                },

                update: {
                    text: option.text,
                    isCorrect: option.isCorrect,
                },

                create: {
                    questionId: dbQuestion.id,
                    text: option.text,
                    isCorrect: option.isCorrect,
                    sortOrder: index,
                },
            });
        }
    }

    console.log("Tribün seed completed successfully.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });