import {
  register,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';
import { logger } from '../logging';

// Initialize metrics collection
register.setDefaultLabels({
  app: 'ganggpt-server',
});

// Enable the default metrics collection
collectDefaultMetrics({ register, prefix: 'ganggpt_' });

// Define custom metrics
export const apiRequestCounter = new Counter({
  name: 'ganggpt_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const aiRequestCounter = new Counter({
  name: 'ganggpt_ai_requests_total',
  help: 'Total number of AI API calls',
  labelNames: ['model', 'endpoint', 'status'],
});

export const aiResponseTime = new Histogram({
  name: 'ganggpt_ai_response_time_seconds',
  help: 'Response time of AI requests in seconds',
  labelNames: ['model', 'endpoint'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10, 30],
});

export const aiTokensUsed = new Counter({
  name: 'ganggpt_ai_tokens_used_total',
  help: 'Total number of tokens used in AI API calls',
  labelNames: ['model', 'endpoint'],
});

export const activeUsers = new Gauge({
  name: 'ganggpt_active_users',
  help: 'Number of currently active users',
});

export const activeMissions = new Gauge({
  name: 'ganggpt_active_missions',
  help: 'Number of currently active missions',
});

export const databaseQueryTime = new Histogram({
  name: 'ganggpt_db_query_time_seconds',
  help: 'Database query execution time in seconds',
  labelNames: ['operation', 'entity'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Export the Prometheus registry
export const metricsRegistry = register;

// Helper function to measure and record AI request time and tokens
export async function measureAiRequest<T>(
  endpoint: string,
  model: string,
  fn: () => Promise<{ result: T; tokens?: number }>
): Promise<T> {
  const startTime = Date.now();
  let status = 'success';

  try {
    const { result, tokens = 0 } = await fn();

    // Record metrics
    aiResponseTime.observe(
      { model, endpoint },
      (Date.now() - startTime) / 1000
    );
    aiRequestCounter.inc({ model, endpoint, status });
    if (tokens > 0) {
      aiTokensUsed.inc({ model, endpoint }, tokens);
    }

    return result;
  } catch (error) {
    status = 'error';
    aiRequestCounter.inc({ model, endpoint, status });
    logger.error('AI Request Failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint,
      model,
    });
    throw error;
  }
}

logger.info('Prometheus metrics initialized');
