import { getClient, extractPagination } from './client';
import {
  Note,
  Label,
  NoteAttachment,
  NoteListFilters,
  PaginatedResponse,
} from '../types';

// erp-app/v1 namespace — Personal Notes & Labels.
//
// Response shapes are normalized via the helpers below so callers can rely on
// stable client-side types regardless of which key variant the backend returns.
// Live shape verification (postman collection only documents request bodies):
//   - notes list rows: assume `labels` is an array of expanded Label objects
//     and `attachments` is an array of expanded attachment objects. Falls back
//     to `label_ids` / `attachment_ids` if backend returns ids only.
//   - timestamps: ISO 8601 strings; fall back to passthrough.

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function normalizeLabel(raw: any): Label {
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ''),
    color: String(raw?.color ?? '#6366F1'),
    description: raw?.description ?? '',
    created_at: raw?.created_at ?? raw?.created ?? undefined,
    updated_at: raw?.updated_at ?? raw?.updated ?? undefined,
  };
}

function normalizeAttachment(raw: any): NoteAttachment {
  if (typeof raw === 'number') {
    return { id: raw, url: '' };
  }
  return {
    id: Number(raw?.id ?? 0),
    url: String(raw?.url ?? raw?.source_url ?? ''),
    filename: raw?.filename ?? raw?.name ?? undefined,
    mime_type: raw?.mime_type ?? raw?.mime ?? undefined,
    size: raw?.size != null ? Number(raw.size) : undefined,
  };
}

export function normalizeNote(raw: any): Note {
  const labelsRaw = Array.isArray(raw?.labels)
    ? raw.labels
    : Array.isArray(raw?.label_ids)
      ? raw.label_ids.map((id: any) => ({ id }))
      : [];
  const attachmentsRaw = Array.isArray(raw?.attachments)
    ? raw.attachments
    : Array.isArray(raw?.attachment_ids)
      ? raw.attachment_ids.map((id: any) => ({ id }))
      : [];

  return {
    id: Number(raw?.id ?? 0),
    title: String(raw?.title ?? ''),
    content: String(raw?.content ?? ''),
    labels: labelsRaw.map(normalizeLabel),
    attachments: attachmentsRaw.map(normalizeAttachment),
    pinned: toBool(raw?.pinned),
    archived: toBool(raw?.archived),
    created_at: raw?.created_at ?? '',
    updated_at: raw?.updated_at ?? raw?.created_at ?? '',
  };
}

// ─── Notes ───

function buildNotesParams(filters: NoteListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));
  if (filters.search) params.set('search', filters.search);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.pinned != null) params.set('pinned', String(filters.pinned));
  if (filters.archived != null) params.set('archived', String(filters.archived));
  // AND semantics: repeat ?label= for each id
  if (filters.label_ids?.length) {
    filters.label_ids.forEach((id) => params.append('label', String(id)));
  }
  return params;
}

export async function listNotes(
  filters: NoteListFilters = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Note>> {
  const client = await getClient();
  const params = buildNotesParams({ page: 1, per_page: 20, ...filters });
  const { data, headers } = await client.get(`/erp-app/v1/notes?${params.toString()}`, {
    signal,
  });
  const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  return { data: items.map(normalizeNote), ...extractPagination(headers) };
}

export async function getNote(id: number): Promise<Note> {
  const client = await getClient();
  const { data } = await client.get(`/erp-app/v1/notes/${id}`);
  return normalizeNote(data);
}

export interface NoteWritePayload {
  title?: string;
  content?: string;
  label_ids?: number[];
  attachment_ids?: number[];
}

export async function createNote(payload: NoteWritePayload): Promise<Note> {
  const client = await getClient();
  const { data } = await client.post('/erp-app/v1/notes', payload);
  return normalizeNote(data);
}

export async function updateNote(id: number, patch: NoteWritePayload): Promise<Note> {
  const client = await getClient();
  const { data } = await client.patch(`/erp-app/v1/notes/${id}`, patch);
  return normalizeNote(data);
}

export async function deleteNote(id: number): Promise<void> {
  const client = await getClient();
  await client.delete(`/erp-app/v1/notes/${id}`);
}

export async function pinNote(id: number): Promise<void> {
  const client = await getClient();
  await client.post(`/erp-app/v1/notes/${id}/pin`);
}

export async function unpinNote(id: number): Promise<void> {
  const client = await getClient();
  await client.post(`/erp-app/v1/notes/${id}/unpin`);
}

export async function archiveNote(id: number): Promise<void> {
  const client = await getClient();
  await client.post(`/erp-app/v1/notes/${id}/archive`);
}

export async function unarchiveNote(id: number): Promise<void> {
  const client = await getClient();
  await client.post(`/erp-app/v1/notes/${id}/unarchive`);
}

// ─── Labels ───

export async function listLabels(query?: { search?: string; perPage?: number }): Promise<Label[]> {
  const client = await getClient();
  const { data } = await client.get('/erp-app/v1/labels', {
    params: {
      page: 1,
      per_page: query?.perPage ?? 50,
      search: query?.search ?? '',
    },
  });
  const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  return items.map(normalizeLabel);
}

export interface LabelWritePayload {
  name: string;
  color: string;
  description?: string;
}

export async function createLabel(payload: LabelWritePayload): Promise<Label> {
  const client = await getClient();
  const { data } = await client.post('/erp-app/v1/labels', payload);
  return normalizeLabel(data);
}

export async function updateLabel(id: number, patch: Partial<LabelWritePayload>): Promise<Label> {
  const client = await getClient();
  const { data } = await client.patch(`/erp-app/v1/labels/${id}`, patch);
  return normalizeLabel(data);
}

export async function deleteLabel(id: number): Promise<void> {
  const client = await getClient();
  await client.delete(`/erp-app/v1/labels/${id}`);
}

// Media uploads use `uploadWPMedia()` from `src/api/endpoints.ts` — same flow
// used by Payment Request: pick locally, upload on save, attach returned id(s).
