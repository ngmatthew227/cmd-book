import { redirect } from "next/navigation";
import { TaskEditorApp } from "@/components/task-editor-app";
import { auth } from "@/lib/auth";

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  return <TaskEditorApp taskId={id} />;
}
