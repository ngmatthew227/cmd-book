import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const changeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  steps: z.array(z.string()).max(500).default([]),
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
      const existing = await prisma.task.findUnique({
        where: { id: change.id },
      });

      const clientUpdatedAt = new Date(change.updatedAt);
      const clientCreatedAt = new Date(change.createdAt);

      if (existing && existing.userId !== userId) {
        continue;
      }

      if (!existing) {
        if (change.isDeleted || change.syncStatus === "pending_delete") {
          accepted.push(change.id);
          continue;
        }

        await prisma.task.create({
          data: {
            id: change.id,
            userId,
            title: change.title,
            description: change.description ?? null,
            steps: change.steps,
            isDeleted: false,
            createdAt: clientCreatedAt,
            updatedAt: clientUpdatedAt,
          },
        });
        accepted.push(change.id);
        continue;
      }

      if (clientUpdatedAt >= existing.updatedAt) {
        await prisma.task.update({
          where: { id: change.id },
          data: {
            title: change.title,
            description: change.description ?? null,
            steps: change.steps,
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
    const serverChanges = await prisma.task.findMany({
      where: {
        userId,
        updatedAt: { gt: since },
      },
      orderBy: { updatedAt: "asc" },
    });

    const serverTime = new Date().toISOString();

    return NextResponse.json({
      accepted,
      serverChanges: serverChanges.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        steps: t.steps,
        isDeleted: t.isDeleted,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      serverTime,
    });
  } catch (error) {
    console.error("task sync error", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
