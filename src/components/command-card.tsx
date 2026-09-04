"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
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
import { cn } from "@/lib/utils";

export function CommandCard({
  item,
  folderName,
  onEdit,
  onDelete,
  onTogglePin,
  onTagClick,
}: {
  item: LocalCommand;
  folderName?: string | null;
  onEdit: (item: LocalCommand) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onTagClick?: (tag: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(false), 2500);
    return () => window.clearTimeout(t);
  }, [confirming]);

  return (
    <Card
      className={cn(
        "group min-w-0 max-w-full overflow-hidden transition-shadow hover:shadow-md",
        item.isPinned && "ring-1 ring-[var(--primary)]/30",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
            <CardTitle className="flex min-w-0 items-center gap-2 truncate">
              {item.isPinned ? (
                <Pin className="size-3.5 shrink-0 fill-[var(--primary)] text-[var(--primary)]" />
              ) : null}
              <span className="truncate">{item.title}</span>
            </CardTitle>
            {item.description ? (
              <CardDescription className="line-clamp-2 break-words">
                {item.description}
              </CardDescription>
            ) : null}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="outline" className="text-[10px] uppercase">
                {item.language || "shell"}
              </Badge>
              {folderName ? (
                <Badge variant="secondary" className="text-[10px]">
                  {folderName}
                </Badge>
              ) : null}
            </div>
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
                <DropdownMenuItem onClick={() => onTogglePin(item.id)}>
                  {item.isPinned ? <PinOff /> : <Pin />}
                  {item.isPinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
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
      <CardContent className="min-w-0">
        <CodeBlock code={item.command} language={item.language || "shell"} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick?.(tag)}
            className="rounded-md"
          >
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-[var(--primary)]/15 hover:text-[var(--primary)]"
            >
              {tag}
            </Badge>
          </button>
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
