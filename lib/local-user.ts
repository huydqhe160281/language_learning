import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

const LOCAL_EMAIL = "local@learn.local";

/** Single local profile for this app (no login). */
export async function getOrCreateLocalUserId(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: LOCAL_EMAIL },
  });
  if (existing) return existing.id;

  const user = await prisma.user.create({
    data: {
      email: LOCAL_EMAIL,
      name: "Learner",
      password: await bcryptjs.hash("unused", 10),
    },
  });
  return user.id;
}
