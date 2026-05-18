import type { ItineraryWsEvent, TravelPlanJson } from "@/modules/TripSetup/model/travel-plan-result.interface"

function buildItineraryAgentWsUrl(): string {
  const base = import.meta.env.VITE_ITINERARY_AGENT_API_URL as string | undefined
  if (!base?.trim()) {
    throw new Error("VITE_ITINERARY_AGENT_API_URL is not set")
  }
  const u = new URL(base.trim())
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
  const path = u.pathname.replace(/\/$/, "")
  u.pathname = `${path}/ws`
  return u.href
}

/**
 * Wait for `plan_done` / `plan_error` on the itinerary agent WebSocket (same host as REST API).
 */
export function waitForItineraryPlan(jobId: string, options?: { timeoutMs?: number }): Promise<TravelPlanJson> {
  const timeoutMs = options?.timeoutMs ?? 25 * 60 * 1000
  const wsUrl = `${buildItineraryAgentWsUrl()}?jobId=${encodeURIComponent(jobId)}`

  return new Promise((resolve, reject) => {
    let settled = false
    const ws = new WebSocket(wsUrl)
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      reject(new Error("Plan generation timed out. Please try again."))
    }, timeoutMs)

    const finish = (err?: Error, plan?: TravelPlanJson) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      if (err) reject(err)
      else if (plan) resolve(plan)
    }

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as ItineraryWsEvent
        if (data.type === "plan_done") {
          finish(undefined, data.plan)
          return
        }
        if (data.type === "plan_error") {
          finish(new Error(data.error))
        }
      } catch (e) {
        finish(e instanceof Error ? e : new Error("Invalid message from itinerary service"))
      }
    }

    ws.onerror = () => {
      finish(new Error("Could not connect for plan updates. Check itinerary service and WebSocket URL."))
    }
  })
}
