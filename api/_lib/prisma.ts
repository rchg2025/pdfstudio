import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getOptimizedDatabaseUrl(): string | undefined {
  const url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    let changed = false;

    // Neon connection pooler operates with PgBouncer
    if (parsed.hostname.includes('-pooler') && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
      changed = true;
    }

    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '10');
      changed = true;
    }

    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '20');
      changed = true;
    }

    return changed ? parsed.toString() : url;
  } catch {
    return url;
  }
}

const dbUrl = getOptimizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {})
  });

globalForPrisma.prisma = prisma;

