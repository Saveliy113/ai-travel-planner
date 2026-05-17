import type { IncomingMessage } from 'http';
import type { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';

import { logger } from '../utils/logger';
import { registerTravelPlanWsClient } from './travel-plan-ws.hub';

/**
 * WebSocket endpoint for long-running plan generation: clients subscribe with `?jobId=` after POST /generate.
 */
export function attachTravelPlanWebSocket(server: HttpServer, pathname: string): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host ?? 'localhost';
      const url = new URL(request.url ?? '/', `http://${host}`);
      if (url.pathname !== pathname) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (e) {
      logger.error(`[TravelPlanWS] upgrade error: ${e instanceof Error ? e.message : e}`);
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req: IncomingMessage) => {
    try {
      const host = req.headers.host ?? 'localhost';
      const url = new URL(req.url ?? '/', `http://${host}`);
      const jobId = url.searchParams.get('jobId')?.trim();
      if (!jobId) {
        ws.close(1008, 'jobId query parameter required');
        return;
      }
      registerTravelPlanWsClient(jobId, ws);
      logger.info(`[TravelPlanWS] client subscribed jobId=${jobId}`);
    } catch (e) {
      logger.error(`[TravelPlanWS] connection error: ${e instanceof Error ? e.message : e}`);
      ws.close(1011, 'internal error');
    }
  });
}
