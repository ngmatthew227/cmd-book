import { redirect } from "next/navigation";
import { LibraryApp } from "@/components/library-app";
import { auth } from "@/lib/auth";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <LibraryApp />;
}
