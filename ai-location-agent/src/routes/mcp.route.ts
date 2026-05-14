import { randomUUID } from 'node:crypto';

import { Request, Response, Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';

import Route from '../interfaces/routes.interface';
import { server, streamableTransports } from '../loaders/mcpServer';
import { logger } from '../utils/logger';

function mcpSessionHeader(req: Request): string | undefined {
  const raw = req.headers['mcp-session-id'];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

class McpRoutes implements Route {
  /** Streamable HTTP MCP: `{apiBase}/mcp` (GET/POST/DELETE). */
  public path = '/mcp';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.all(this.path, async (req: Request, res: Response) => {
      try {
        const sessionId = mcpSessionHeader(req);
        let transport: StreamableHTTPServerTransport | undefined;

        if (sessionId) {
          transport = streamableTransports.get(sessionId);
          if (!transport) {
            res.status(404).json({
              jsonrpc: '2.0',
              error: {
                code: -32_000,
                message: 'Not Found: unknown MCP session',
              },
              id: null,
            });
            return;
          }
        } else if (req.method === 'POST' && isInitializeRequest(req.body)) {
          const eventStore = new InMemoryEventStore();
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            eventStore,
            onsessioninitialized: (sid) => {
              streamableTransports.set(sid, transport!);
              logger.info(`[MCP] Streamable HTTP session: ${sid}`);
            },
          });
          transport.onclose = () => {
            const sid = transport?.sessionId;
            if (sid && streamableTransports.has(sid)) {
              streamableTransports.delete(sid);
              logger.info(`[MCP] Streamable HTTP session closed: ${sid}`);
            }
          };
          await server.connect(transport);
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32_000,
              message: 'Bad Request: invalid MCP session or missing initialize',
            },
            id: null,
          });
          return;
        }

        await transport.handleRequest(req, res, req.body);
      } catch (err) {
        logger.error(`[MCP] Streamable HTTP error: ${err instanceof Error ? err.message : err}`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32_603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });
  }
}

export default McpRoutes;
