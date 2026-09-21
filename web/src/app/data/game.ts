export type Game = {
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    questionCount: number;
    secondsPerQuestion: number;
};

export const games: Game[] = [
    {
        slug: "ne-kadar-taraftarsin",
        title: "Ne Kadar Taraftarsın?",
        shortDescription:
            "Takımını ne kadar iyi tanıyorsun? Zamana karşı bilgini test et.",
        description:
            "Kayıt olurken seçtiğin takım hakkında sorulan sorulara mümkün olan en kısa sürede doğru cevap ver ve diğer taraftarlarla yarış.",
        questionCount: 10,
        secondsPerQuestion: 8,
    },
    {
        slug: "golu-kim-atmisti",
        title: "Golü Kim Atmıştı?",
        shortDescription:
            "Unutulmaz derbileri hatırla. Golleri kimin attığını bul.",
        description:
            "Geçmiş derbilerin yılı ve maç skoru gösterilir. Eksik bırakılan golcüyü mümkün olan en kısa sürede bulmaya çalış.",
        questionCount: 10,
        secondsPerQuestion: 10,
    },
];