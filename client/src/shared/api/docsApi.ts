import type {
  CanonicalContractsResponse,
  DivisionId,
  DocCategory,
  DocRecord,
  DocSearchResult,
  DocStatus,
  DocSummary,
  RubricCriterion,
  RubricRecord,
  RubricStatus,
} from '../types/domain.ts';

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    details?: string[];
  };

  if (!response.ok) {
    const detailsText =
      Array.isArray(data.details) && data.details.length > 0
        ? `: ${data.details.join('; ')}`
        : '';
    throw new Error(`${data.error ?? `Request failed (${response.status})`}${detailsText}`);
  }

  return data;
}

export interface CreateDocPayload {
  slug: string;
  title: string;
  category: DocCategory;
  divisionId: DivisionId;
  authorAgentId: number;
  status: DocStatus;
  tags: string[];
  content: string;
}

export type UpdateDocPayload = Partial<Omit<CreateDocPayload, 'slug'>>;

export interface CreateRubricPayload {
  id?: string;
  title: string;
  workflowName: string;
  ownerDivision: DivisionId;
  ownerAgentId: number;
  contractRef: string;
  backlogItemIds: string[];
  criteria: RubricCriterion[];
  overallStatus: RubricStatus;
  notes: string;
}

export type UpdateRubricPayload = Partial<Omit<CreateRubricPayload, 'id'>>;

export const docsApi = {
  getCanonicalContracts: () =>
    apiRequest<CanonicalContractsResponse>('/api/contracts/canonical'),

  listDocs: (filters?: {
    category?: DocCategory | '';
    division?: DivisionId | '';
    status?: DocStatus | '';
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.division) params.set('division', filters.division);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return apiRequest<{ docs: DocSummary[] }>(`/api/docs${qs ? `?${qs}` : ''}`);
  },

  getDoc: (slug: string) =>
    apiRequest<{ doc: DocRecord }>(`/api/docs/${encodeURIComponent(slug)}`),

  createDoc: (payload: CreateDocPayload) =>
    apiRequest<{ doc: DocRecord }>('/api/docs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDoc: (slug: string, payload: UpdateDocPayload) =>
    apiRequest<{ doc: DocRecord }>(`/api/docs/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteDoc: (slug: string) =>
    apiRequest<{ ok: true; deletedSlug: string }>(
      `/api/docs/${encodeURIComponent(slug)}`,
      { method: 'DELETE' },
    ),

  searchDocs: (params: {
    q: string;
    category?: DocCategory | '';
    division?: DivisionId | '';
  }) => {
    const sp = new URLSearchParams();
    sp.set('q', params.q);
    if (params.category) sp.set('category', params.category);
    if (params.division) sp.set('division', params.division);
    return apiRequest<{ query: string; results: DocSearchResult[] }>(
      `/api/search?${sp.toString()}`,
    );
  },

  listRubrics: (filters?: {
    division?: DivisionId | '';
    status?: RubricStatus | '';
  }) => {
    const sp = new URLSearchParams();
    if (filters?.division) sp.set('division', filters.division);
    if (filters?.status) sp.set('status', filters.status);
    const qs = sp.toString();
    return apiRequest<{ rubrics: RubricRecord[] }>(
      `/api/rubrics${qs ? `?${qs}` : ''}`,
    );
  },

  createRubric: (payload: CreateRubricPayload) =>
    apiRequest<{ rubric: RubricRecord }>('/api/rubrics', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRubric: (id: string, payload: UpdateRubricPayload) =>
    apiRequest<{ rubric: RubricRecord }>(`/api/rubrics/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
