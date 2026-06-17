import api from './api';
import type { Tag } from './types';

// ---------------------------------------------------------------------------
// List all tags
// ---------------------------------------------------------------------------
export async function getTags(): Promise<Tag[]> {
  const response = await api.get<Tag[]>('/api/v1/tags');
  return response.data;
}

// ---------------------------------------------------------------------------
// Create a tag
// ---------------------------------------------------------------------------
export async function createTag(name: string, color: string): Promise<Tag> {
  const response = await api.post<Tag>('/api/v1/tags', { name, color });
  return response.data;
}
