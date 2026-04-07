import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.studySession.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.card.deleteMany();
  await prisma.set.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      email: "local@learn.local",
      name: "Learner",
      password: await bcryptjs.hash("unused", 10),
      bio: "Learning Japanese and Chinese",
    },
  });

  // Create sample sets
  const japaneseSet = await prisma.set.create({
    data: {
      title: "Japanese Hiragana Basics",
      description: "Learn basic Japanese Hiragana characters",
      language: "Japanese",
      isPublic: true,
      userId: user1.id,
    },
  });

  const chineseSet = await prisma.set.create({
    data: {
      title: "Chinese Pinyin 101",
      description: "Master common Chinese characters and their pinyin",
      language: "Chinese",
      isPublic: true,
      userId: user1.id,
    },
  });

  // Add cards to Japanese set
  const japaneseCards = [
    { front: "あ", back: "a" },
    { front: "い", back: "i" },
    { front: "う", back: "u" },
    { front: "え", back: "e" },
    { front: "お", back: "o" },
    { front: "こんにちは", back: "Hello" },
    { front: "ありがとう", back: "Thank you" },
    { front: "さようなら", back: "Goodbye" },
  ];

  for (const card of japaneseCards) {
    await prisma.card.create({
      data: {
        ...card,
        setId: japaneseSet.id,
      },
    });
  }

  // Add cards to Chinese set
  const chineseCards = [
    { front: "你好", back: "Hello" },
    { front: "谢谢", back: "Thank you" },
    { front: "再见", back: "Goodbye" },
    { front: "对不起", back: "Sorry" },
    { front: "是", back: "Yes" },
    { front: "不", back: "No" },
    { front: "水", back: "Water" },
    { front: "火", back: "Fire" },
  ];

  for (const card of chineseCards) {
    await prisma.card.create({
      data: {
        ...card,
        setId: chineseSet.id,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
