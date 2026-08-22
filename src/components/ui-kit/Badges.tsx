import { cn } from "@/lib/utils";
import { PRESENCE_LABEL, PRESENCE_TONE, type PresenceType } from "@/lib/lead-insights";

export function PresenceBadge({
  type,
  label,
  className,
}: {
  type: PresenceType;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
        PRESENCE_TONE[type],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {label ?? PRESENCE_LABEL[type]}
    </span>
  );
}

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  completed: { label: "Concluída", tone: "bg-success-soft text-success" },
  processing: { label: "Em execução", tone: "bg-info-soft text-info" },
  pending: { label: "Na fila", tone: "bg-muted text-muted-foreground" },
  failed: { label: "Falhou", tone: "bg-destructive-soft text-destructive" },
};

export function SearchStatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const key = status ?? "pending";
  const meta = STATUS_MAP[key] ?? { label: key, tone: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full bg-current", key === "processing" && "animate-pulse")}
      />
      {meta.label}
    </span>
  );
}
