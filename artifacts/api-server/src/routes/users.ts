import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(usersTable).orderBy(usersTable.name);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Error listing users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const [user] = await db
      .insert(usersTable)
      .values({
        name: body.name,
        email: body.email,
        role: body.role ?? "atendente",
        active: body.active ?? true,
      })
      .returning();
    res.status(201).json(user);
  } catch (err) {
    req.log.error({ err }, "Error creating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const body = req.body;
    const update: Partial<typeof usersTable.$inferInsert> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.email !== undefined) update.email = body.email;
    if (body.role !== undefined) update.role = body.role;
    if (body.active !== undefined) update.active = body.active;

    const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Error deleting user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
