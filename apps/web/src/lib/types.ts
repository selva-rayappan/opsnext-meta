// ---------------------------------------------------------------------------
// Shared domain types for EP-02 Contact & Account Management
// ---------------------------------------------------------------------------

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  source?: string;
  ownerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  accountLinks?: {
    account: { id: string; name: string };
    isPrimary: boolean;
  }[];
}

export interface Account {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  phone?: string;
  ownerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  contactLinks?: {
    contact: { id: string; firstName: string; lastName: string };
    isPrimary: boolean;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateContactDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  source?: string;
}

export type UpdateContactDto = Partial<CreateContactDto> & { isActive?: boolean };

export interface CreateAccountDto {
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  phone?: string;
}

export type UpdateAccountDto = Partial<CreateAccountDto> & { isActive?: boolean };

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Lead (EP-03)
// ---------------------------------------------------------------------------

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';

export interface Lead {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  score: number;
  ownerId: string | null;
  notes: string | null;
  convertedAt: string | null;
  convertedContactId: string | null;
  convertedOpportunityId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  score?: number;
  notes?: string;
}

export type UpdateLeadDto = Partial<CreateLeadDto> & { status?: LeadStatus };

export interface ConvertLeadDto {
  createOpportunity: boolean;
  opportunityTitle?: string;
  pipelineId?: string;
  amount?: number;
}

// ---------------------------------------------------------------------------
// Opportunity & Pipeline (EP-04)
// ---------------------------------------------------------------------------

export type StageType = 'OPEN' | 'WON' | 'LOST';

export interface Stage {
  id: string;
  organizationId: string;
  pipelineId: string;
  name: string;
  probability: number;
  order: number;
  stageType: StageType;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  stages?: Stage[];
}

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface Opportunity {
  id: string;
  organizationId: string;
  name: string;
  amount: number | null;
  currency: string;
  closeDate: string;
  stageId: string;
  pipelineId: string;
  contactId: string | null;
  accountId: string | null;
  ownerId: string | null;
  probability: number;
  status: OpportunityStatus;
  lostReason: string | null;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  updatedAt: string;
  stage?: Stage;
  pipeline?: Pipeline;
  contact?: { id: string; firstName: string; lastName: string } | null;
  account?: { id: string; name: string } | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
  stageHistory?: StageHistory[];
}

export interface StageHistory {
  id: string;
  organizationId: string;
  opportunityId: string;
  fromStageId: string | null;
  toStageId: string;
  changedById: string;
  changedAt: string;
  fromStage?: Stage | null;
  toStage?: Stage;
  changedBy?: { id: string; firstName: string; lastName: string };
}

// DTOs
export interface CreatePipelineDto {
  name: string;
  isDefault?: boolean;
}

export interface UpdatePipelineDto {
  name?: string;
  isDefault?: boolean;
}

export interface CreateStageDto {
  name: string;
  probability?: number;
  stageType?: StageType;
}

export interface UpdateStageDto {
  name?: string;
  probability?: number;
  stageType?: StageType;
}

export interface ReorderStagesDto {
  stageIds: string[];
}

export interface CreateOpportunityDto {
  name: string;
  amount?: number;
  currency?: string;
  closeDate: string;
  pipelineId: string;
  stageId: string;
  contactId?: string;
  accountId?: string;
  ownerId?: string;
  probability?: number;
}

export interface UpdateOpportunityDto {
  name?: string;
  amount?: number;
  currency?: string;
  closeDate?: string;
  pipelineId?: string;
  stageId?: string;
  contactId?: string;
  accountId?: string;
  ownerId?: string;
  probability?: number;
}

export interface ChangeStageDto {
  stageId: string;
}

export interface MarkWonDto {
  wonAt?: string;
}

export interface MarkLostDto {
  lostReason: string;
}

// ============================================================================
// EP-05 & EP-07: Activities, Tasks, and Reporting Types
// ============================================================================

export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL_LOG' | 'NOTE';

export interface Activity {
  id: string;
  organizationId: string;
  type: ActivityType;
  subject: string;
  body?: string;
  dueAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string };
  contact?: { id: string; firstName: string; lastName: string };
  account?: { id: string; name: string };
  lead?: { id: string; firstName: string; lastName: string };
  opportunity?: { id: string; name: string };
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  createdById: string;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  createdBy?: { id: string; firstName: string; lastName: string };
  contact?: { id: string; firstName: string; lastName: string };
  account?: { id: string; name: string };
  lead?: { id: string; firstName: string; lastName: string };
  opportunity?: { id: string; name: string };
}

export interface PipelineSummaryRow {
  name: string;
  count: number;
  totalValue: number;
  expectedValue: number;
}

export interface ActivityByRepRow {
  name: string;
  email: string;
  CALL: number;
  MEETING: number;
  EMAIL_LOG: number;
  NOTE: number;
  total: number;
}

export interface LeadFunnelStats {
  statusCounts: {
    NEW: number;
    CONTACTED: number;
    QUALIFIED: number;
    UNQUALIFIED: number;
    CONVERTED: number;
    total: number;
  };
  conversionRate: number;
}

export interface WinLossStats {
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  winRate: number;
}

export interface RevenueForecastRow {
  month: string;
  totalValue: number;
  expectedValue: number;
}

// ---------------------------------------------------------------------------
// Saved Reports (EP-07)
// ---------------------------------------------------------------------------

export interface SavedReport {
  id: string;
  organizationId: string;
  createdById: string;
  name: string;
  reportType: string; // 'pipeline-summary' | 'activity-by-rep' | 'lead-funnel' | 'win-loss' | 'revenue-forecast'
  filters: Record<string, unknown>;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
}

