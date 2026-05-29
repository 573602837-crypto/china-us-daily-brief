import { PrismaClient } from "@prisma/client";

declare global {
  var chinaUsDailyPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.chinaUsDailyPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.chinaUsDailyPrisma = prisma;
}
