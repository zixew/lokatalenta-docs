export const DOC_CATEGORIES = [
  'architecture',
  'adr',
  'contract',
  'charter',
  'grooming',
  'rubric',
  'runbook',
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_STATUSES = ['draft', 'reviewed', 'approved'] as const;

export type DocStatus = (typeof DOC_STATUSES)[number];

export const RUBRIC_STATUSES = ['pass', 'partial', 'fail'] as const;

export type RubricStatus = (typeof RUBRIC_STATUSES)[number];

export const CANONICAL_DIVISION_IDS = [
  'executive',
  'architecture',
  'engineering',
  'qa',
  'devops',
  'lounge',
] as const;

export type DivisionId = (typeof CANONICAL_DIVISION_IDS)[number];

export interface CanonicalDivision {
  id: DivisionId;
  name: string;
  shortName: string;
  motto: string;
  color: string;
  threeColor: string;
  defaultFloor: 1 | 2 | 3;
  defaultZone: string;
  agentIds: number[];
}

export interface CanonicalAgent {
  id: number;
  name: string;
  shortName: string;
  role: string;
  divisionId: DivisionId;
  category: string;
  avatar: string;
  skills: {
    primary: string[];
    stack: string[];
  };
  methodology: string[];
  certifications: string[];
  defaultZone: string;
  defaultFloor: 1 | 2 | 3;
}

export interface CollaborationPair {
  id: number;
  initiator: number;
  target: number;
  dialogueInitiator: string;
  dialogueTarget: string;
  taskDesc: string;
}

export interface CanonicalServicePort {
  id: string;
  name: string;
  githubRepo: string;
  githubUrl: string;
  apiPort: number;
  devUiPort: number | null;
  baseUrl: string;
  devUiUrl?: string;
  wsUrl?: string;
  sseUrl?: string;
  healthPath: string;
}

export interface CanonicalContractsResponse {
  divisions: CanonicalDivision[];
  agents: CanonicalAgent[];
  collaborationPairs: CollaborationPair[];
  ports: CanonicalServicePort[];
}

export interface DocRecord {
  slug: string;
  title: string;
  category: DocCategory;
  divisionId: DivisionId;
  authorAgentId: number;
  status: DocStatus;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type DocSummary = Omit<DocRecord, 'content'> & {
  excerpt: string;
};

export interface DocSearchResult {
  slug: string;
  title: string;
  category: DocCategory;
  divisionId: DivisionId;
  authorAgentId: number;
  status: DocStatus;
  tags: string[];
  updatedAt: string;
  rank: number;
  snippet: string;
}

export interface RubricCriterion {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  status: RubricStatus;
  evidence: string;
}

export interface RubricRecord {
  id: string;
  title: string;
  workflowName: string;
  ownerDivision: DivisionId;
  ownerAgentId: number;
  contractRef: string;
  backlogItemIds: string[];
  criteria: RubricCriterion[];
  overallStatus: RubricStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
