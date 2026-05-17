import WebSocket from 'ws';

import { logger } from '../utils/logger';

const clientsByJob = new Map<string, Set<WebSocket>>();
/** Latest event per job (success or error) for clients that connect after broadcast. */
const lastEventByJob = new Map<string, Record<string, unknown>>();

function addClient(jobId: string, ws: WebSocket): void {
  let set = clientsByJob.get(jobId);
  if (!set) {
    set = new Set();
    clientsByJob.set(jobId, set);
  }
  set.add(ws);
}

function removeClient(jobId: string, ws: WebSocket): void {
  const set = clientsByJob.get(jobId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) clientsByJob.delete(jobId);
}

export function registerTravelPlanWsClient(jobId: string, ws: WebSocket): void {
  const replay = lastEventByJob.get(jobId);
  if (replay) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(replay));
      }
    } catch (e) {
      logger.error(`[TravelPlanWS] replay send: ${e instanceof Error ? e.message : e}`);
    }
    ws.close();
    return;
  }

  addClient(jobId, ws);
  ws.on('close', () => removeClient(jobId, ws));
  ws.on('error', () => removeClient(jobId, ws));
}

export function broadcastTravelPlanEvent(
  jobId: string,
  payload: Record<string, unknown>,
): void {
  lastEventByJob.set(jobId, payload);

  const set = clientsByJob.get(jobId);
  if (!set?.size) {
    logger.warn(`[TravelPlanWS] No subscribers for jobId=${jobId}`);
    return;
  }
  const raw = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(raw);
      } catch (e) {
        logger.error(`[TravelPlanWS] send failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
}
