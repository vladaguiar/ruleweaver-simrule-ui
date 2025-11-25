// Coverage Service for SimRule UI
// Handles all coverage analysis API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type { CoverageReportResponse, RuleCoverageDto } from '@/types/api.types';

class CoverageService {
  /**
   * Get all coverage reports for a rule set
   */
  async getReports(ruleSet: string, options?: RequestOptions): Promise<CoverageReportResponse[]> {
    const endpoint = API_ENDPOINTS.COVERAGE(ruleSet);
    return apiService.get<CoverageReportResponse[]>(endpoint, options);
  }

  /**
   * Get the latest coverage report for a rule set
   */
  async getLatest(ruleSet: string, options?: RequestOptions): Promise<CoverageReportResponse> {
    const endpoint = API_ENDPOINTS.COVERAGE_LATEST(ruleSet);
    return apiService.get<CoverageReportResponse>(endpoint, options);
  }

  /**
   * Generate a new coverage report for a rule set
   */
  async generate(ruleSet: string, options?: RequestOptions): Promise<CoverageReportResponse> {
    const endpoint = API_ENDPOINTS.COVERAGE(ruleSet);
    return apiService.post<CoverageReportResponse, object>(endpoint, {}, options);
  }

  /**
   * Get coverage summary for multiple rule sets
   */
  async getSummary(
    ruleSets: string[],
    options?: RequestOptions
  ): Promise<
    Array<{
      ruleSet: string;
      coveragePercentage: number;
      totalRules: number;
      testedRules: number;
      untestedRules: number;
    }>
  > {
    const reports = await Promise.all(
      ruleSets.map(async (ruleSet) => {
        try {
          const report = await this.getLatest(ruleSet, options);
          return {
            ruleSet,
            coveragePercentage: report.metrics.coveragePercentage,
            totalRules: report.metrics.totalRules,
            testedRules: report.metrics.rulesTested,
            untestedRules: report.metrics.rulesUntested,
          };
        } catch {
          return {
            ruleSet,
            coveragePercentage: 0,
            totalRules: 0,
            testedRules: 0,
            untestedRules: 0,
          };
        }
      })
    );

    return reports;
  }

  /**
   * Get untested rules across all rule sets
   */
  async getAllUntestedRules(
    ruleSets: string[],
    options?: RequestOptions
  ): Promise<
    Array<{
      ruleSet: string;
      rules: RuleCoverageDto[];
    }>
  > {
    const reports = await Promise.all(
      ruleSets.map(async (ruleSet) => {
        try {
          const report = await this.getLatest(ruleSet, options);
          return {
            ruleSet,
            rules: report.untestedRules,
          };
        } catch {
          return {
            ruleSet,
            rules: [],
          };
        }
      })
    );

    return reports.filter((r) => r.rules.length > 0);
  }

  /**
   * Get coverage trends for a rule set
   */
  async getTrends(
    ruleSet: string,
    options?: RequestOptions
  ): Promise<
    Array<{
      date: string;
      coverage: number;
    }>
  > {
    const report = await this.getLatest(ruleSet, options);

    if (!report.trends || report.trends.length === 0) {
      return [];
    }

    return report.trends.map((t) => ({
      date: new Date(t.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      coverage: t.coveragePercentage,
    }));
  }

  /**
   * Calculate overall coverage across multiple rule sets
   */
  async getOverallCoverage(
    ruleSets: string[],
    options?: RequestOptions
  ): Promise<{
    overallPercentage: number;
    totalRules: number;
    testedRules: number;
    untestedRules: number;
  }> {
    const summary = await this.getSummary(ruleSets, options);

    const totalRules = summary.reduce((sum, s) => sum + s.totalRules, 0);
    const testedRules = summary.reduce((sum, s) => sum + s.testedRules, 0);
    const untestedRules = summary.reduce((sum, s) => sum + s.untestedRules, 0);

    const overallPercentage = totalRules > 0 ? (testedRules / totalRules) * 100 : 0;

    return {
      overallPercentage,
      totalRules,
      testedRules,
      untestedRules,
    };
  }

  /**
   * Get rule heatmap data for a rule set
   */
  async getHeatmapData(
    ruleSet: string,
    options?: RequestOptions
  ): Promise<
    Array<{
      rule: string;
      hits: number;
      status: 'covered' | 'low' | 'untested';
      successRate: number;
    }>
  > {
    const report = await this.getLatest(ruleSet, options);

    const testedRules = report.testedRules.map((r) => ({
      rule: r.ruleName,
      hits: r.executionCount,
      status: r.executionCount >= 10 ? 'covered' : 'low',
      successRate: r.successRate || 100,
    })) as Array<{
      rule: string;
      hits: number;
      status: 'covered' | 'low' | 'untested';
      successRate: number;
    }>;

    const untestedRules = report.untestedRules.map((r) => ({
      rule: r.ruleName,
      hits: 0,
      status: 'untested' as const,
      successRate: 0,
    }));

    return [...testedRules, ...untestedRules];
  }

  /**
   * Get color for coverage percentage
   */
  getCoverageColor(percentage: number): string {
    if (percentage >= 90) return '#C3E770'; // success green
    if (percentage >= 70) return '#87C1F1'; // info blue
    if (percentage >= 50) return '#F7EA73'; // warning yellow
    return '#EF6F53'; // error red
  }

  /**
   * Get risk level for untested rule
   */
  getRiskLevel(rule: RuleCoverageDto): 'high' | 'medium' | 'low' {
    // Determine risk based on rule characteristics
    // This is a simplified implementation - could be enhanced with more logic
    const name = rule.ruleName.toLowerCase();

    if (
      name.includes('validation') ||
      name.includes('security') ||
      name.includes('payment') ||
      name.includes('critical')
    ) {
      return 'high';
    }

    if (
      name.includes('discount') ||
      name.includes('bonus') ||
      name.includes('calculation')
    ) {
      return 'medium';
    }

    return 'low';
  }
}

// Export singleton instance
export const coverageService = new CoverageService();

// Export class for testing
export { CoverageService };
