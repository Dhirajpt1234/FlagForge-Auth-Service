export interface IDatabaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<string>;
}
