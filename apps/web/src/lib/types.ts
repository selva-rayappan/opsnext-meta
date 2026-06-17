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
