"use client";

import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import powershell from "highlight.js/lib/languages/powershell";
import plaintext from "highlight.js/lib/languages/plaintext";
import { cn } from "@/lib/utils";

let registered = false;
function ensureLanguages() {
  if (registered) return;
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("shell", bash);
  hljs.registerLanguage("sh", bash);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("js", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("ts", typescript);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("sql", sql);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("yaml", yaml);
  hljs.registerLanguage("yml", yaml);
  hljs.registerLanguage("dockerfile", dockerfile);
  hljs.registerLanguage("powershell", powershell);
  hljs.registerLanguage("plaintext", plaintext);
  registered = true;
}

export function CodeBlock({
  code,
  language = "shell",
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const html = useMemo(() => {
    ensureLanguages();
    const lang = language || "shell";
    try {
      if (hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return hljs.highlight(code, { language: "plaintext" }).value;
    }
  }, [code, language]);

  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg bg-[var(--code-bg)] p-2.5 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[var(--code-fg)] sm:p-3 sm:text-[13px]",
        className,
      )}
    >
      <code
        className="hljs block max-w-full break-all whitespace-pre-wrap sm:whitespace-pre sm:break-normal"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
