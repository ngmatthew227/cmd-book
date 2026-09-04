"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(className)}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy command"}
    >
      {copied ? <Check className="text-emerald-600" /> : <Copy />}
    </Button>
  );
}
