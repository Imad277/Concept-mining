import type { Freshness } from "@/core";
import { Badge } from "@/components/ui/Badge";
import { FRESHNESS_LABEL } from "@/lib/format";

const TONE: Record<Freshness, "live" | "delayed" | "stale" | "unavailable"> = {
  LIVE: "live",
  DELAYED: "delayed",
  STALE: "stale",
  UNAVAILABLE: "unavailable",
};

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <Badge tone={TONE[freshness]}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {FRESHNESS_LABEL[freshness]}
    </Badge>
  );
}
