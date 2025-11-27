// Tests for Scenario Service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScenarioService } from './scenario.service';
import { apiService } from './api.service';
import type { ScenarioResponse, PaginatedResponse } from '@/types/api.types';

// Mock the api service
vi.mock('./api.service', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ScenarioService', () => {
  let scenarioService: ScenarioService;

  const mockScenarios: ScenarioResponse[] = [
    {
      id: 'scen-1',
      name: 'Scenario 1',
      description: 'Test scenario 1',
      ruleSet: 'rule-set-1',
      factType: 'Customer',
      status: 'ACTIVE',
      testData: { name: 'Test' },
      tags: ['tag1', 'tag2'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user1',
    },
    {
      id: 'scen-2',
      name: 'Scenario 2',
      description: 'Test scenario 2',
      ruleSet: 'rule-set-2',
      factType: 'Order',
      status: 'DRAFT',
      testData: { name: 'Test2' },
      tags: ['tag2', 'tag3'],
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      createdBy: 'user2',
    },
    {
      id: 'scen-3',
      name: 'Another Scenario',
      description: 'Different description',
      ruleSet: 'rule-set-1',
      factType: 'Customer',
      status: 'ARCHIVED',
      testData: { name: 'Test3' },
      tags: ['tag1'],
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
      createdBy: 'user1',
    },
  ];

  beforeEach(() => {
    scenarioService = new ScenarioService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all scenarios without filters', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.getAll();

      expect(apiService.get).toHaveBeenCalledWith('/scenarios', undefined);
      expect(result).toEqual(mockScenarios);
    });

    it('should fetch scenarios with status filter', async () => {
      vi.mocked(apiService.get).mockResolvedValue([mockScenarios[0]]);

      const result = await scenarioService.getAll({ status: 'ACTIVE' });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('status=ACTIVE'),
        undefined
      );
      expect(result).toHaveLength(1);
    });

    it('should fetch scenarios with ruleSet filter', async () => {
      vi.mocked(apiService.get).mockResolvedValue([mockScenarios[0], mockScenarios[2]]);

      const result = await scenarioService.getAll({ ruleSet: 'rule-set-1' });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('ruleSet=rule-set-1'),
        undefined
      );
      expect(result).toHaveLength(2);
    });

    it('should fetch scenarios with multiple filters', async () => {
      vi.mocked(apiService.get).mockResolvedValue([mockScenarios[0]]);

      const result = await scenarioService.getAll({
        status: 'ACTIVE',
        ruleSet: 'rule-set-1',
      });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringMatching(/status=ACTIVE.*ruleSet=rule-set-1|ruleSet=rule-set-1.*status=ACTIVE/),
        undefined
      );
    });
  });

  describe('getPaginated', () => {
    it('should return paginated response when server supports pagination', async () => {
      const paginatedResponse: PaginatedResponse<ScenarioResponse> = {
        content: [mockScenarios[0]],
        totalElements: 3,
        totalPages: 3,
        page: 0,
        size: 1,
      };

      vi.mocked(apiService.get).mockResolvedValue(paginatedResponse);

      const result = await scenarioService.getPaginated({ page: 0, size: 1 });

      expect(result).toEqual(paginatedResponse);
    });

    it('should convert array response to paginated format', async () => {
      // Server returns plain array (no pagination support)
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.getPaginated({ page: 0, size: 2 });

      expect(result.content).toHaveLength(2);
      expect(result.totalElements).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(0);
      expect(result.size).toBe(2);
    });

    it('should use default pagination values', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.getPaginated();

      expect(result.page).toBe(0);
      expect(result.size).toBe(10);
    });

    it('should handle pagination with sort parameters', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      await scenarioService.getPaginated({ page: 0, size: 10, sort: 'name', direction: 'ASC' });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=name'),
        undefined
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('direction=ASC'),
        undefined
      );
    });
  });

  describe('getById', () => {
    it('should fetch a single scenario by ID', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios[0]);

      const result = await scenarioService.getById('scen-1');

      expect(apiService.get).toHaveBeenCalledWith('/scenarios/scen-1', undefined);
      expect(result).toEqual(mockScenarios[0]);
    });
  });

  describe('create', () => {
    it('should create a new scenario', async () => {
      const newScenario = {
        name: 'New Scenario',
        ruleSet: 'rule-set-1',
        factType: 'Customer',
        testData: { name: 'New' },
      };
      const createdScenario = {
        ...newScenario,
        id: 'scen-new',
        status: 'DRAFT' as const,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
        createdBy: 'user1',
      };

      vi.mocked(apiService.post).mockResolvedValue(createdScenario);

      const result = await scenarioService.create(newScenario);

      expect(apiService.post).toHaveBeenCalledWith('/scenarios', newScenario, undefined);
      expect(result).toEqual(createdScenario);
    });
  });

  describe('update', () => {
    it('should update an existing scenario', async () => {
      const updates = { name: 'Updated Name' };
      const updatedScenario = { ...mockScenarios[0], ...updates };

      vi.mocked(apiService.put).mockResolvedValue(updatedScenario);

      const result = await scenarioService.update('scen-1', updates);

      expect(apiService.put).toHaveBeenCalledWith('/scenarios/scen-1', updates, undefined);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete a scenario', async () => {
      vi.mocked(apiService.delete).mockResolvedValue(undefined);

      await scenarioService.delete('scen-1');

      expect(apiService.delete).toHaveBeenCalledWith('/scenarios/scen-1', undefined);
    });
  });

  describe('clone', () => {
    it('should clone a scenario', async () => {
      const clonedScenario = { ...mockScenarios[0], id: 'scen-clone' };

      vi.mocked(apiService.post).mockResolvedValue(clonedScenario);

      const result = await scenarioService.clone('scen-1');

      expect(apiService.post).toHaveBeenCalledWith('/scenarios/scen-1/clone', {}, undefined);
      expect(result.id).toBe('scen-clone');
    });
  });

  describe('bulkDelete', () => {
    it('should use bulk delete API when available', async () => {
      const bulkResponse = {
        totalRequested: 2,
        successCount: 2,
        failureCount: 0,
        deletedIds: ['scen-1', 'scen-2'],
        failures: [],
      };
      vi.mocked(apiService.delete).mockResolvedValue(bulkResponse);

      const result = await scenarioService.bulkDelete(['scen-1', 'scen-2']);

      expect(apiService.delete).toHaveBeenCalledWith(
        '/scenarios/bulk',
        expect.objectContaining({ body: JSON.stringify({ ids: ['scen-1', 'scen-2'] }) })
      );
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should fall back to individual deletes when bulk endpoint returns 404', async () => {
      // First call (bulk endpoint) returns 404
      vi.mocked(apiService.delete)
        .mockRejectedValueOnce({ status: 404 })
        .mockResolvedValue(undefined);

      const result = await scenarioService.bulkDelete(['scen-1', 'scen-2']);

      // Should have called bulk endpoint first, then individual deletes
      expect(apiService.delete).toHaveBeenCalledTimes(3);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.deletedIds).toContain('scen-1');
      expect(result.deletedIds).toContain('scen-2');
    });

    it('should handle partial failures in fallback mode', async () => {
      // First call (bulk endpoint) returns 404
      vi.mocked(apiService.delete)
        .mockRejectedValueOnce({ status: 404 })
        .mockResolvedValueOnce(undefined) // scen-1 succeeds
        .mockRejectedValueOnce(new Error('Delete failed')); // scen-2 fails

      const result = await scenarioService.bulkDelete(['scen-1', 'scen-2']);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.deletedIds).toContain('scen-1');
      expect(result.failures[0].id).toBe('scen-2');
    });
  });

  describe('getByStatus', () => {
    it('should fetch scenarios by status', async () => {
      vi.mocked(apiService.get).mockResolvedValue([mockScenarios[0]]);

      const result = await scenarioService.getByStatus('ACTIVE');

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('status=ACTIVE'),
        undefined
      );
    });
  });

  describe('getByRuleSet', () => {
    it('should fetch scenarios by rule set', async () => {
      vi.mocked(apiService.get).mockResolvedValue([mockScenarios[0], mockScenarios[2]]);

      const result = await scenarioService.getByRuleSet('rule-set-1');

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('ruleSet=rule-set-1'),
        undefined
      );
    });
  });

  describe('activate', () => {
    it('should activate a scenario', async () => {
      const activatedScenario = { ...mockScenarios[1], status: 'ACTIVE' as const };

      vi.mocked(apiService.put).mockResolvedValue(activatedScenario);

      const result = await scenarioService.activate('scen-2');

      expect(apiService.put).toHaveBeenCalledWith(
        '/scenarios/scen-2',
        { status: 'ACTIVE' },
        undefined
      );
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('archive', () => {
    it('should archive a scenario', async () => {
      const archivedScenario = { ...mockScenarios[0], status: 'ARCHIVED' as const };

      vi.mocked(apiService.put).mockResolvedValue(archivedScenario);

      const result = await scenarioService.archive('scen-1');

      expect(apiService.put).toHaveBeenCalledWith(
        '/scenarios/scen-1',
        { status: 'ARCHIVED' },
        undefined
      );
      expect(result.status).toBe('ARCHIVED');
    });
  });

  describe('getRuleSets', () => {
    it('should return unique rule sets sorted alphabetically', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.getRuleSets();

      expect(result).toEqual(['rule-set-1', 'rule-set-2']);
    });

    it('should return empty array when no scenarios', async () => {
      vi.mocked(apiService.get).mockResolvedValue([]);

      const result = await scenarioService.getRuleSets();

      expect(result).toEqual([]);
    });
  });

  describe('getTags', () => {
    it('should return unique tags sorted alphabetically', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.getTags();

      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return empty array when scenarios have no tags', async () => {
      const scenariosWithoutTags = mockScenarios.map((s) => ({ ...s, tags: undefined }));
      vi.mocked(apiService.get).mockResolvedValue(scenariosWithoutTags);

      const result = await scenarioService.getTags();

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('should search scenarios by name', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.search('Scenario 1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Scenario 1');
    });

    it('should search scenarios by description', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.search('Different');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Another Scenario');
    });

    it('should search scenarios by tags', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.search('tag3');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Scenario 2');
    });

    it('should be case insensitive', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.search('SCENARIO');

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no matches', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockScenarios);

      const result = await scenarioService.search('nonexistent');

      expect(result).toHaveLength(0);
    });
  });
});
