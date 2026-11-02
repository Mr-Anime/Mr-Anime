import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Role = "user" | "creator" | "moderator" | "admin";
const rank: Record<Role, number> = { user: 0, creator: 1, moderator: 2, admin: 3 };

export async function requireRole(minRole: Role) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  const [u] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!u || rank[u.role as Role] < rank[minRole]) throw new Error("FORBIDDEN");
  return { session, user: u };
}
