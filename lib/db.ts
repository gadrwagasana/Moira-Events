import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Explicit, modest pool sizing — PrismaPg's first argument is a real
// node-postgres pg.PoolConfig (not just a connection string), so these
// fields are genuinely respected by the pg.Pool it creates internally,
// unlike Prisma's own classic connection_limit/pool_timeout query-string
// parameters, which this driver-adapter setup does not use at all. Added
// after repeatedly reproducing "Server has closed the connection" /
// ConnectionClosed errors against the local dev database specifically
// during `next build`'s parallel static-generation phase (11 workers, each
// its own process with its own uncapped-by-default pool) — ten low-traffic
// marketing pages now each query the database once (for Site Settings),
// where previously most had no database call at all. A small, explicit
// max keeps any single process's total connection demand bounded instead
// of relying on node-postgres's own default.
const createAdapter = () =>
  new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

const prismaClientSingleton = () => new PrismaClient({ adapter: createAdapter() });

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
