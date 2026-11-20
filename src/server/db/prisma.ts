import { PrismaClient } from "@prisma/client";

if (typeof window !== "undefined") {
  throw new Error("PrismaClient must only be imported in server modules.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
    transactionOptions: {
      maxWait: 10_000,
      timeout: 25_000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
