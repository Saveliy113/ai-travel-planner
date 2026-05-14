import { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import Route from '../interfaces/routes.interface';
import { server, transports } from '../loaders/mcpServer';
import { logger } from '../utils/logger';

class McpRoutes implements Route {
  public path = '/mcp';
  public router = Router();

  constructor() {
    const apiBase = `/api/${process.env.API_VERSION ?? 'v1'}`;
    const messagesPath = `${apiBase}${this.path}/messages`;
    this.initializeRoutes(messagesPath);
  }

  private initializeRoutes(messagesPath: string): void {
    this.router.get(`${this.path}/sse`, async (req: Request, res: Response) => {
      const transport = new SSEServerTransport(messagesPath, res);

      try {
        await server.connect(transport);
      } catch (err) {
        logger.error(`[MCP] connect failed: ${err instanceof Error ? err.message : err}`);
        if (!res.headersSent) {
          res.status(500).end('MCP connection failed');
        }
        return;
      }

      const sessionId = transport.sessionId;
      transports.set(sessionId, transport);
      logger.info(`[MCP] Session started: ${sessionId}`);

      res.on('close', () => {
        transports.delete(sessionId);
        void transport.close().catch(() => undefined);
        logger.info(`[MCP] Session closed: ${sessionId}`);
      });
    });

    this.router.post(`${this.path}/messages`, async (req: Request, res: Response) => {
      const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
      const transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        res.status(404).send('Session not found');
        return;
      }

      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (err) {
        logger.error(`[MCP] handlePostMessage: ${err instanceof Error ? err.message : err}`);
        if (!res.headersSent) {
          res.status(500).end('Failed to process MCP message');
        }
      }
    });
  }
}

export default McpRoutes;
