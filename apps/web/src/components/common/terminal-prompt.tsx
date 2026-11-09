import { cn } from "@/lib/utils";

/** "pablo@systems:~/snapotter_": the title of the PabloSystems theme, shown beside the logo. */
export function TerminalPrompt({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-mono text-sm font-bold whitespace-nowrap select-none", className)}
      aria-hidden="true"
    >
      <span className="text-primary-ink">pablo@systems</span>
      <span className="text-muted-foreground">:</span>
      <span className="text-accent-ink">~/snapotter</span>
      <span className="text-detail motion-safe:animate-pulse">_</span>
    </span>
  );
}
