import { redirect } from "next/navigation";
import { TasksApp } from "@/components/tasks-app";
import { auth } from "@/lib/auth";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <TasksApp />;
}
