import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { userCorrectiveOverrides } from "@/lib/db/schema";

export function listOverrides() {
  const db = getDb();
  return db.select().from(userCorrectiveOverrides).all().map((r) => ({
    id: r.id,
    controlId: r.controlId,
    reasonCode: r.reasonCode,
    actionText: r.actionText,
    links: JSON.parse(r.links || "[]") as string[],
    createdAt: r.createdAt,
  }));
}

export function createOverride(input: {
  controlId: string;
  reasonCode: string;
  actionText: string;
  links?: string[];
}) {
  const db = getDb();
  const id = uuidv4();
  db.insert(userCorrectiveOverrides)
    .values({
      id,
      controlId: input.controlId,
      reasonCode: input.reasonCode,
      actionText: input.actionText,
      links: JSON.stringify(input.links ?? []),
      createdAt: new Date().toISOString(),
    })
    .run();
  return id;
}

export function deleteOverride(id: string) {
  const db = getDb();
  db.delete(userCorrectiveOverrides)
    .where(eq(userCorrectiveOverrides.id, id))
    .run();
}
