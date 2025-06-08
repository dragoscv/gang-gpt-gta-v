import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('prom-client', () => ({
  register: {
    setDefaultLabels: vi.fn(),
    metrics: vi.fn().mockReturnValue('# Metrics'),
  },
  Counter: vi.fn().mockImplementation(() => ({
    inc: vi.fn(),
  })),
  Gauge: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
  })),
  Histogram: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
  })),
  collectDefaultMetrics: vi.fn(),
}));

vi.mock('../logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Metrics Module', () => {
    it('should export metrics instances', async () => {
      const metrics = await import('./metrics');

      expect(metrics.apiRequestCounter).toBeDefined();
      expect(metrics.aiRequestCounter).toBeDefined();
      expect(metrics.aiResponseTime).toBeDefined();
      expect(metrics.aiTokensUsed).toBeDefined();
      expect(metrics.activeUsers).toBeDefined();
      expect(metrics.activeMissions).toBeDefined();
      expect(metrics.databaseQueryTime).toBeDefined();
      expect(metrics.measureAiRequest).toBeDefined();
    });

    it('should have measureAiRequest helper function', async () => {
      const { measureAiRequest } = await import('./metrics');

      expect(typeof measureAiRequest).toBe('function');
    });

    it('should handle AI request measurement success', async () => {
      const { measureAiRequest } = await import('./metrics');

      const mockFn = vi.fn().mockResolvedValue({
        result: 'test result',
        tokens: 100,
      });

      const result = await measureAiRequest(
        'test-endpoint',
        'test-model',
        mockFn
      );
      expect(result).toBe('test result');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should handle AI request measurement errors', async () => {
      const { measureAiRequest } = await import('./metrics');

      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        measureAiRequest('test-endpoint', 'test-model', mockFn)
      ).rejects.toThrow('Test error');
    });
  });

  describe('Monitoring Index', () => {
    it('should export monitoring objects', async () => {
      const monitoring = await import('./index');

      expect(monitoring.monitoring).toBeDefined();
      expect(monitoring.metricsRegistry).toBeDefined();
      expect(monitoring.apiRequestCounter).toBeDefined();
      expect(monitoring.aiRequestCounter).toBeDefined();
      expect(monitoring.measureAiRequest).toBeDefined();
    });

    it('should re-export metrics from main module', async () => {
      const monitoring = await import('./index');

      expect(monitoring.aiResponseTime).toBeDefined();
      expect(monitoring.aiTokensUsed).toBeDefined();
      expect(monitoring.activeUsers).toBeDefined();
      expect(monitoring.activeMissions).toBeDefined();
      expect(monitoring.databaseQueryTime).toBeDefined();
    });
  });
});
