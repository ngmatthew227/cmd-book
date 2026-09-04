"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BookMarked, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className ?? "size-4"}
    >
      <path d="M12 2C6.477 2 2 6.584 2 12.233c0 4.514 2.865 8.337 6.839 9.686.5.094.683-.222.683-.48 0-.237-.01-1.023-.014-1.853-2.782.617-3.369-1.21-3.369-1.21-.455-1.18-1.11-1.495-1.11-1.495-.908-.636.069-.623.069-.623 1.003.072 1.532 1.053 1.532 1.053.892 1.563 2.341 1.112 2.91.85.091-.66.35-1.112.636-1.367-2.22-.259-4.555-1.138-4.555-5.066 0-1.119.39-2.034 1.029-2.752-.103-.258-.446-1.302.098-2.714 0 0 .84-.275 2.75 1.05A9.36 9.36 0 0 1 12 7.14a9.36 9.36 0 0 1 2.504.345c1.909-1.325 2.747-1.05 2.747-1.05.546 1.412.203 2.456.1 2.714.64.718 1.028 1.633 1.028 2.752 0 3.939-2.339 4.804-4.566 5.058.359.317.679.943.679 1.901 0 1.372-.012 2.477-.012 2.814 0 .26.18.58.688.48A10.24 10.24 0 0 0 22 12.233C22 6.584 17.523 2 12 2Z" />
    </svg>
  );
}

export function LoginForm({ githubEnabled }: { githubEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }
      router.push("/library");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-[var(--border)]/80 shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            <BookMarked className="size-4" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl">
            cmd-book
          </span>
        </div>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to sync your command library across devices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Sign in
          </Button>
        </form>

        {githubEnabled ? (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--card)] px-2 text-[var(--muted-foreground)]">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("github", { callbackUrl: "/library" })}
            >
              <GitHubIcon /> GitHub
            </Button>
          </>
        ) : null}
      </CardContent>
      <CardFooter className="justify-center text-sm text-[var(--muted-foreground)]">
        No account?{" "}
        <Link href="/register" className="ml-1 text-[var(--primary)] underline-offset-4 hover:underline">
          Create one
        </Link>
      </CardFooter>
    </Card>
  );
}
