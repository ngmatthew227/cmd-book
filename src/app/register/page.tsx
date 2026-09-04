import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { auth } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/library");

  return (
    <main className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <RegisterForm />
    </main>
  );
}
