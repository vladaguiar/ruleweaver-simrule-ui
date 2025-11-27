// Tests for Statistics Service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatisticsService } from './statistics.service';
import { apiService } from './api.service';
import type { TrendsResponse, OverviewResponse, DailyActivity } from '@/types/api.types';

// Mock the api service
vi.mock('./api.service', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('StatisticsService', () => {
  let statisticsService: StatisticsService;

  const mockTrends: TrendsResponse = {
    period: 'weekly',
    dataPoints: [
      { date: '2024-01-01', scenarios: 10, successRate: 85, avgExecutionTime: 150 },
      { date: '2024-01-02', scenarios: 12, successRate: 90, avgExecutionTime: 140 },
      { date: '2024-01-03', scenarios: 15, successRate: 88, avgExecutionTime: 145 },
    ],
    summary: {
      totalSimulations: 37,
      totalScenarios: 37,
      avgSuccessRate: 87.7,
      trend: 'UP',
      percentageChange: 5.3,
    },
  };

  const mockOverview: OverviewResponse = {
    totalScenarios: 50,
    activeScenarios: 35,
    totalSimulations: 100,
    simulationsToday: 5,
    runningSimulations: 2,
    overallSuccessRate: 92.5,
    todaySuccessRate: 95.0,
    totalDatasets: 10,
    activeDatasets: 8,
    statusBreakdown: {
      PENDING: 1,
      RUNNING: 2,
      COMPLETED: 95,
      FAILED: 2,
      CANCELLED: 0,
    },
    lastSimulationAt: '2024-01-15T10:30:00Z',
    avgExecutionTimeMs: 1500,
    totalScenariosExecuted: 500,
    totalScenariosPassed: 462,
  };

  const mockActivity: DailyActivity[] = [
    { date: '2024-01-01', tests: 10, passed: 8 },
    { date: '2024-01-02', tests: 12, passed: 11 },
    { date: '2024-01-03', tests: 15, passed: 14 },
  ];

  beforeEach(() => {
    statisticsService = new StatisticsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getActivity', () => {
    it('should fetch daily activity statistics', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockActivity);

      const result = await statisticsService.getActivity();

      expect(apiService.get).toHaveBeenCalledWith('/statistics/activity', undefined);
      expect(result).toEqual(mockActivity);
    });

    it('should return empty array when endpoint not available (404)', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 404 });

      const result = await statisticsService.getActivity();

      expect(result).toEqual([]);
    });

    it('should throw error for non-404 errors', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 500 });

      await expect(statisticsService.getActivity()).rejects.toEqual({ status: 500 });
    });
  });

  describe('getTrends', () => {
    it('should fetch trends with default period (weekly)', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockTrends);

      const result = await statisticsService.getTrends();

      expect(apiService.get).toHaveBeenCalledWith('/statistics/trends?period=weekly', undefined);
      expect(result).toEqual(mockTrends);
    });

    it('should fetch trends with specified period', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockTrends);

      await statisticsService.getTrends('daily');

      expect(apiService.get).toHaveBeenCalledWith('/statistics/trends?period=daily', undefined);
    });

    it('should return null when endpoint not available (404)', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 404 });

      const result = await statisticsService.getTrends();

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 500 });

      await expect(statisticsService.getTrends()).rejects.toEqual({ status: 500 });
    });
  });

  describe('getOverview', () => {
    it('should fetch overview statistics', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockOverview);

      const result = await statisticsService.getOverview();

      expect(apiService.get).toHaveBeenCalledWith('/statistics/overview', undefined);
      expect(result).toEqual(mockOverview);
    });

    it('should return null when endpoint not available (404)', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 404 });

      const result = await statisticsService.getOverview();

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 500 });

      await expect(statisticsService.getOverview()).rejects.toEqual({ status: 500 });
    });
  });

  describe('getTrendDirection', () => {
    it('should return UP for positive change > 1', () => {
      expect(statisticsService.getTrendDirection(5)).toBe('UP');
      expect(statisticsService.getTrendDirection(1.1)).toBe('UP');
    });

    it('should return DOWN for negative change < -1', () => {
      expect(statisticsService.getTrendDirection(-5)).toBe('DOWN');
      expect(statisticsService.getTrendDirection(-1.1)).toBe('DOWN');
    });

    it('should return STABLE for change between -1 and 1', () => {
      expect(statisticsService.getTrendDirection(0)).toBe('STABLE');
      expect(statisticsService.getTrendDirection(0.5)).toBe('STABLE');
      expect(statisticsService.getTrendDirection(-0.5)).toBe('STABLE');
      expect(statisticsService.getTrendDirection(1)).toBe('STABLE');
      expect(statisticsService.getTrendDirection(-1)).toBe('STABLE');
    });
  });

  describe('formatPercentageChange', () => {
    it('should format positive values with + prefix', () => {
      expect(statisticsService.formatPercentageChange(5.5)).toBe('+5.5%');
      expect(statisticsService.formatPercentageChange(0.1)).toBe('+0.1%');
    });

    it('should format negative values without prefix', () => {
      expect(statisticsService.formatPercentageChange(-5.5)).toBe('-5.5%');
    });

    it('should format zero without prefix', () => {
      expect(statisticsService.formatPercentageChange(0)).toBe('0.0%');
    });

    it('should round to 1 decimal place', () => {
      expect(statisticsService.formatPercentageChange(5.555)).toBe('+5.6%');
      expect(statisticsService.formatPercentageChange(5.544)).toBe('+5.5%');
    });
  });
});
