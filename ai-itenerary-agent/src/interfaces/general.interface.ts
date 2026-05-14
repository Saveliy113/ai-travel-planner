import { Request } from 'express';
import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';

interface SqlQueryConstructorData {
  whereClause: string;
  sqlJoin: string;
  queryBind: (number | string | number[])[];
}

interface GeneralGetByQueryResponse<T> {
  data: T[];
  count: number;
}

interface GeneralRequestQuery<T> extends Request<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  T
> {}

/** One tool from MCP Client#listTools() (JSON Schema inputSchema). */
interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type?: string;
    properties?: Record<string, object>;
    required?: string[];
    [key: string]: unknown;
  };
}

type OpenAITool = ChatCompletionFunctionTool;

export {
  SqlQueryConstructorData,
  GeneralGetByQueryResponse,
  GeneralRequestQuery,
  McpToolDefinition,
  OpenAITool,
};
