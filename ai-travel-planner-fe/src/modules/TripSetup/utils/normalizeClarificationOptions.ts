import type { DestinationClarificationOption } from "@/modules/TripSetup/model/tripSetup.interface"

/** Coerces LLM/API clarification rows into `{ name, description }` — models often send title/area/rationale. */
export function normalizeDestinationClarificationOptions(
  raw: unknown,
): DestinationClarificationOption[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const out: DestinationClarificationOption[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s.length > 0) {
        out.push({ name: s, description: "" })
      }
      continue
    }
    if (item == null || typeof item !== "object") {
      continue
    }
    const o = item as Record<string, unknown>
    const name = String(
      o.name ?? o.title ?? o.label ?? o.area ?? o.region ?? o.place ?? o.sublocation ?? "",
    ).trim()
    const description = String(
      o.description ??
        o.rationale ??
        o.summary ??
        o.details ??
        o.subtitle ??
        o.explanation ??
        "",
    ).trim()
    if (name.length > 0 || description.length > 0) {
      out.push({
        name: name || description.slice(0, 80) || "Option",
        description: description || name,
      })
    }
  }
  return out
}
