import { Request } from 'express';

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

export { SqlQueryConstructorData, GeneralGetByQueryResponse, GeneralRequestQuery };
