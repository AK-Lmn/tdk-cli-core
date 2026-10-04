import { execFileSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma/client";

// Apply the checked-in migrations before serving, so the first query finds its table.
execFileSync("bunx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", service: "orders-api" }));

app.post("/orders", async (c) => {
  const { item } = await c.req.json();
  return c.json({ order: await prisma.order.create({ data: { item } }) }, 201);
});

app.get("/orders", async (c) => c.json({ orders: await prisma.order.findMany() }));

export default { port: process.env.PORT || 3000, fetch: app.fetch };
