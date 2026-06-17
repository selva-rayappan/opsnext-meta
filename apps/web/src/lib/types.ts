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
