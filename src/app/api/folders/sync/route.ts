import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const changeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  syncStatus: z.enum(["pending_insert", "pending_update", "pending_delete"]),
});

const syncSchema = z.object({
  changes: z.array(changeSchema),
  lastSyncedAt: z.string().nullable(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const json = await request.json();
    const parsed = syncSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
    }

    const { changes, lastSyncedAt } = parsed.data;
    const accepted: string[] = [];

    for (const change of changes) {
      const existing = await prisma.folder.findUnique({
        where: { id: change.id },
      });
      const clientUpdatedAt = new Date(change.updatedAt);
      const clientCreatedAt = new Date(change.createdAt);

      if (existing && existing.userId !== userId) continue;

      if (!existing) {
        if (change.isDeleted || change.syncStatus === "pending_delete") {
          accepted.push(change.id);
          continue;
        }
        await prisma.folder.create({
          data: {
            id: change.id,
            userId,
            name: change.name,
            isDeleted: false,
            createdAt: clientCreatedAt,
            updatedAt: clientUpdatedAt,
          },
        });
        accepted.push(change.id);
        continue;
      }

      if (clientUpdatedAt >= existing.updatedAt) {
        await prisma.folder.update({
          where: { id: change.id },
          data: {
            name: change.name,
            isDeleted: change.isDeleted || change.syncStatus === "pending_delete",
            updatedAt: clientUpdatedAt,
          },
        });
        accepted.push(change.id);
      } else {
        accepted.push(change.id);
      }
    }

    const since = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);
    const serverChanges = await prisma.folder.findMany({
      where: { userId, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
    });

    return NextResponse.json({
      accepted,
      serverChanges: serverChanges.map((f) => ({
        id: f.id,
        name: f.name,
        isDeleted: f.isDeleted,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("folder sync error", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
