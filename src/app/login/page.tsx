import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/library");

  const githubEnabled = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <LoginForm githubEnabled={githubEnabled} />
    </main>
  );
}
