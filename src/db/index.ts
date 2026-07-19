import { setDefaultResultOrder } from "node:dns";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// The database host advertises both AAAA and A records. On a network without
// working IPv6 egress, Node tries the AAAA addresses first and every new
// connection stalls until it times out (ETIMEDOUT), which surfaces as
// intermittent 500s on any request that touches the database. Preferring IPv4
// keeps connection setup on the route that actually works.
setDefaultResultOrder("ipv4first");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
