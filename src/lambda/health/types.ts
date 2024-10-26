export type HealthCheck = {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  table?: string;
  latency?: number;
  error?: string;
};
