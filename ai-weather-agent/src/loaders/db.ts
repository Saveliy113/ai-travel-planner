import { Pool, types, PoolClient } from 'pg';

types.setTypeParser(1114, function (stringValue: string) {
  return stringValue;
});
types.setTypeParser(1082, function (stringValue: string) {
  return stringValue;
});

export default new Pool({
  max: 5,
  connectionString: process.env.DB_STRING,
  idleTimeoutMillis: 30000,
});

export { PoolClient };
