"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LocalCommand } from "@/lib/types";

export function CommandCard({
  item,
  onEdit,
  onDelete,
}: {
  item: LocalCommand;
  onEdit: (item: LocalCommand) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(false), 2500);
    return () => window.clearTimeout(t);
  }, [confirming]);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate">{item.title}</CardTitle>
            {item.description ? (
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CopyButton text={item.command} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    if (!confirming) {
                      setConfirming(true);
                      return;
                    }
                    onDelete(item.id);
                  }}
                >
                  <Trash2 />
                  {confirming ? "Confirm delete" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg bg-[var(--code-bg)] p-2.5 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[var(--code-fg)] sm:p-3 sm:text-[13px]">
          <code className="break-all whitespace-pre-wrap sm:whitespace-pre sm:break-normal">
            {item.command}
          </code>
        </pre>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
        {item.syncStatus !== "synced" ? (
          <Badge variant="outline" className="ml-auto">
            {item.syncStatus.replace("pending_", "")}
          </Badge>
        ) : null}
      </CardFooter>
    </Card>
  );
}
