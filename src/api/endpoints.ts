import { getClient, getCredentials, extractPagination } from './client';
import {
  Employee,
  Birthday,
  LeaveRequest,
  Holiday,
  CalendarEvent,
  Announcement,
  SelfAttendance,
  SelfAttendanceLog,
  AttendanceReportDay,
  LeavePolicy,
  PaginatedResponse,
} from '../types';

// ─── Employee / Profile ───

export async function getMyProfile(userId: number): Promise<Employee> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}`, {
    params: { include: 'department,designation,reporting_to,avatar' },
  });
  return data;
}

export async function getTeamDirectory(
  page = 1,
  perPage = 20,
  search?: string
): Promise<PaginatedResponse<Employee>> {
  const client = await getClient();
  const { data, headers } = await client.get('/erp/v1/hrm/employees', {
    params: { page, per_page: perPage, status: 'active', s: search, include: 'department,designation,avatar' },
  });
  return { data, ...extractPagination(headers) };
}

export async function getMyExperiences(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/experiences`, {
    params: { per_page: 10 },
  });
  return data;
}

export async function getMyEducations(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/educations`);
  return data;
}

export async function getMyDependents(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/dependents`);
  return data;
}

export async function getMyJobHistory(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/jobs`);
  return data;
}

export async function getMyNotes(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/notes`);
  return data;
}

export async function uploadPhoto(userId: number, uri: string, fileName: string, mimeType = 'image/jpeg') {
  const credentials = await getCredentials();
  if (!credentials) throw new Error('Not authenticated');

  const { siteUrl, token } = credentials;
  const baseURL = `${siteUrl}/wp-json`;

  // Step 1: Upload the image file using fetch (handles RN FormData reliably)
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: fileName,
    type: mimeType,
  } as any);

  const uploadRes = await fetch(`${baseURL}/erp/v1/hrm/employees/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => null);
    throw new Error(errBody?.message || `Upload failed (${uploadRes.status})`);
  }

  const uploadData = await uploadRes.json();
  const photoId = uploadData?.photo_id;
  if (!photoId) throw new Error('Upload failed — no photo ID returned');

  // Step 2: Associate the uploaded photo with the employee
  const patchRes = await fetch(`${baseURL}/erp/v1/hrm/employees/upload`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photo_id: photoId, user_id: userId }),
  });

  if (!patchRes.ok) {
    const errBody = await patchRes.json().catch(() => null);
    throw new Error(errBody?.message || `Failed to update photo (${patchRes.status})`);
  }

  return patchRes.json();
}

// ─── Birthdays ───

export async function getUpcomingBirthdays(): Promise<Birthday[]> {
  const client = await getClient();
  const { data } = await client.get('/erp/v1/hrm/birthdays', {
    params: { upcoming: true, _t: Date.now() },
  });
  return data;
}

// ─── Leave ───

// Normalize raw leave request from API (handles Unix timestamps, flat fields, string IDs)
function normalizeLeaveRequest(raw: any): LeaveRequest {
  return {
    id: Number(raw.id),
    user_id: Number(raw.user_id),
    employee_id: Number(raw.employee_id),
    employee_name: raw.employee_name || raw.display_name || raw.name || '',
    avatar_url: raw.avatar_url || '',
    status: Number(raw.status || raw.last_status || 2),
    start_date: parseLeaveDate(raw.start_date),
    end_date: parseLeaveDate(raw.end_date),
    reason: raw.reason || '',
    comments: raw.comments || '',
    message: raw.message || raw.required_approval_message || '',
    required_approval: raw.required_approval ?? null,
    days: raw.days ? Number(raw.days) : undefined,
    available: raw.available != null ? Number(raw.available) : undefined,
    spent: raw.spent != null ? Number(raw.spent) : undefined,
    entitlement: raw.entitlement != null ? Number(raw.entitlement) : undefined,
    policy: raw.policy || {
      id: Number(raw.leave_id || 0),
      name: raw.policy_name || '',
      description: '',
      color: raw.color || '',
    },
  };
}

// Parse date: handles both Unix timestamp strings and ISO date strings
function parseLeaveDate(value: string | number): string {
  if (!value) return '';
  const num = Number(value);
  // If it's a large number, treat as Unix timestamp (seconds)
  if (!isNaN(num) && num > 100000) {
    const d = new Date(num * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  // Already a date string
  return String(value);
}

export async function getMyLeaveRequests(
  userId: number
): Promise<LeaveRequest[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/leaves`, {
    params: { per_page: 100 },
  });
  const items = Array.isArray(data) ? data : [];
  return items.map(normalizeLeaveRequest);
}

export async function getLeaveRequestDetail(id: number, userId: number): Promise<LeaveRequest | null> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/leaves`);
  const items = Array.isArray(data) ? data : [];
  const normalized = items.map(normalizeLeaveRequest);
  return normalized.find((r) => r.id === id) || null;
}

export async function submitLeaveRequest(payload: {
  user_id: number;
  policy_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  files?: { uri: string; name: string; type: string }[];
}) {
  const credentials = await getCredentials();
  if (!credentials) throw new Error('Not authenticated');

  const { siteUrl, token } = credentials;
  const baseURL = `${siteUrl}/wp-json`;

  const formData = new FormData();
  formData.append('policy_id', String(payload.policy_id));
  formData.append('start_date', payload.start_date);
  formData.append('end_date', payload.end_date + ' 23:59:59');
  formData.append('reason', payload.reason);
  formData.append('notification', '');

  if (payload.files?.length) {
    payload.files.forEach((file) => {
      formData.append('leave_document[]', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
  }

  const res = await fetch(`${baseURL}/erp/v1/hrm/employees/${payload.user_id}/leaves`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.message || `Request failed (${res.status})`);
  }

  return res.json();
}

export async function getMyLeavePolicies(userId: number): Promise<LeavePolicy[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/policies`);
  const items = Array.isArray(data) ? data : [];
  return items.map((p: any) => ({
    id: Number(p.leave_id || p.id),
    name: p.policy || p.name || '',
    description: p.description || '',
    color: p.color || '',
  }));
}

export async function getMyPendingLeaves(userId: number): Promise<LeaveRequest[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp-app/v1/hrm/employees/${userId}/pending-leaves`);
  const items = Array.isArray(data) ? data : [];
  return items.map(normalizeLeaveRequest);
}

export async function getMyRejectedLeaves(userId: number): Promise<LeaveRequest[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp-app/v1/hrm/employees/${userId}/rejected-leaves`);
  const items = Array.isArray(data) ? data : [];
  return items.map(normalizeLeaveRequest);
}

export async function getPendingLeaveDetail(userId: number, requestId: number): Promise<LeaveRequest | null> {
  const items = await getMyPendingLeaves(userId);
  return items.find((r) => r.id === requestId) ?? null;
}

export async function getRejectedLeaveDetail(userId: number, requestId: number): Promise<LeaveRequest | null> {
  const items = await getMyRejectedLeaves(userId);
  return items.find((r) => r.id === requestId) ?? null;
}

export async function getMyLeaveBalance(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/policies`, {
    params: { per_page: 100 },
  });
  return data;
}

export async function getWhoIsOut(): Promise<LeaveRequest[]> {
  const client = await getClient();
  const { data } = await client.get('/erp/v1/hrm/leaves/requests', {
    params: { type: 'upcoming', _t: Date.now() },
  });
  return data;
}

// ─── Holidays ───

export async function getHolidays(): Promise<Holiday[]> {
  const client = await getClient();
  const { data } = await client.get('/erp/v1/hrm/leaves/holidays', {
    params: { per_page: 100, _t: Date.now() },
  });
  return data;
}

// ─── Calendar Events ───

export async function getMyCalendarEvents(
  userId: number,
  year: number
): Promise<CalendarEvent[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/events`, {
    params: { start: `${year}-01-01`, end: `${year}-12-31`, per_page: 100 },
  });
  return data;
}

// ─── Standup ───

export interface StandupSummary {
  present: number;
  absent: number;
  leave: number;
  total: number;
}

export interface StandupLog {
  date: string;
  status: 'present' | 'absent' | 'leave';
}

export interface StandupResponse {
  summary: StandupSummary;
  logs: StandupLog[];
}

export async function getMyStandupLog(
  params: { month: string } | { from: string; to: string }
): Promise<StandupResponse> {
  const client = await getClient();
  const { data } = await client.get('/erp-app/v1/standup/my-log', { params });
  return {
    summary: data?.summary ?? { present: 0, absent: 0, leave: 0, total: 0 },
    logs: Array.isArray(data?.logs) ? data.logs : [],
  };
}

// ─── Standup Manager ───

export interface StandupEmployee {
  employee_id: number;
  first_name: string;
  last_name: string;
  name: string;
  standup_status: 'present' | 'absent' | 'leave' | null;
}

export async function checkStandupPermission(): Promise<boolean> {
  try {
    const client = await getClient();
    await client.get('/erp-app/v1/standup/history');
    return true;
  } catch {
    return false;
  }
}

export async function getStandupEmployees(date: string): Promise<StandupEmployee[]> {
  const client = await getClient();
  const { data } = await client.get('/erp-app/v1/standup/employees', { params: { date } });
  return Array.isArray(data) ? data : [];
}

export async function saveStandup(
  date: string,
  records: { employee_id: number; status: 'present' | 'absent' | 'leave' }[]
): Promise<{ success: boolean; message: string }> {
  const client = await getClient();
  const { data } = await client.post('/erp-app/v1/standup/save', { date, records });
  return data;
}

// ─── Payment Requests ───

export interface PaymentAttachment {
  id: number;
  url: string;
  type: string;
  filename: string;
}

export interface PaymentRequest {
  id: number;
  title: string;
  amount: string;
  description: string;
  purchase_date: string | null;
  expect_payment_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  payment_type: string | null;
  hr_note: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  attachments: PaymentAttachment[];
  employee_name?: string;
}

export async function uploadWPMedia(uri: string, name: string, mimeType: string): Promise<number> {
  const credentials = await getCredentials();
  if (!credentials) throw new Error('Not authenticated');
  const formData = new FormData();
  formData.append('file', { uri, name, type: mimeType } as any);
  const res = await fetch(`${credentials.siteUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${credentials.token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  if (!data?.id) throw new Error('Upload failed — no attachment ID returned');
  return data.id as number;
}

export interface PaymentRequestsResponse {
  currency: string;
  data: PaymentRequest[];
}

export async function getCurrency(): Promise<string> {
  const client = await getClient();
  const { data } = await client.get('/erp-app/v1/currency');
  return typeof data === 'string' ? data : (data?.currency ?? '');
}

export async function getPaymentRequests(): Promise<PaymentRequestsResponse> {
  const client = await getClient();
  const { data } = await client.get('/erp-app/v1/payment-requests', { params: { _t: Date.now() } });
  // Handle both new { currency, data } shape and legacy plain array
  if (Array.isArray(data)) {
    return { currency: '', data };
  }
  return {
    currency: data?.currency ?? '',
    data: Array.isArray(data?.data) ? data.data : [],
  };
}

export async function getPaymentRequest(id: number): Promise<PaymentRequest> {
  const client = await getClient();
  const { data } = await client.get(`/erp-app/v1/payment-requests/${id}`);
  return data;
}

export async function createPaymentRequest(payload: {
  title: string;
  amount: number;
  description: string;
  purchase_date?: string;
  expect_payment_by?: string;
  attachment_ids: number[];
}): Promise<PaymentRequest> {
  const client = await getClient();
  const { data } = await client.post('/erp-app/v1/payment-requests', payload);
  return data;
}

// ─── Attendance ───

export async function getSelfAttendance(): Promise<{ attendance: SelfAttendance; log: SelfAttendanceLog }> {
  const client = await getClient();
  // Cache-bust to avoid stale responses after clock in/out
  const { data } = await client.get('/erp/v1/hrm/attendance/self-attendance', {
    params: { _t: Date.now() },
  });
  return data;
}

export async function clockInOut(type: 'checkin' | 'checkout') {
  // Use native fetch because save_attendance() uses wp_send_json_success/die()
  // which can cause issues with Axios response handling
  const credentials = await getCredentials();
  if (!credentials) throw new Error('Not authenticated');

  const { siteUrl, token } = credentials;

  const response = await fetch(`${siteUrl}/wp-json/erp/v1/hrm/attendance/self-attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  });

  const data = await response.json();

  if (data?.success === false) {
    throw new Error(typeof data?.data === 'string' ? data.data : 'Clock action failed');
  }

  return data?.data ?? data;
}

export async function getMyAttendanceLogs(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/attendance/logs/${userId}`);
  return data;
}

export async function getMyAttendanceReport(
  userId: number,
  startDate?: string,
  endDate?: string
): Promise<AttendanceReportDay[]> {
  const client = await getClient();
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await client.get(`/erp/v1/hrm/attendance/reports/${userId}`, { params });
  return data;
}

// ─── Announcements ───

function normalizeAnnouncement(raw: any): Announcement {
  return {
    id: Number(raw.id || raw.ID || raw.post_id),
    title: raw.title || raw.post_title || '',
    body: raw.body || raw.post_content || '',
    status: raw.status || raw.post_status || '',
    date: raw.date || raw.post_date || '',
    author: raw.author || raw.post_author || '',
  };
}

export async function getMyAnnouncements(
  userId: number,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<Announcement>> {
  const client = await getClient();
  const { data, headers } = await client.get(`/erp/v1/hrm/employees/${userId}/announcements`, {
    params: { page, per_page: perPage },
  });
  const items = Array.isArray(data) ? data : [];
  return { data: items.map(normalizeAnnouncement), ...extractPagination(headers) };
}

export async function getAnnouncementDetail(userId: number, id: number): Promise<Announcement | null> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/announcements`);
  const items = Array.isArray(data) ? data : [];
  const normalized = items.map(normalizeAnnouncement);
  return normalized.find((a) => a.id === id) || null;
}

// ─── Documents ───

export async function getMyDocuments(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/docs/${userId}`);
  return data;
}

export async function createFolder(userId: number, dirName: string, parentId?: number) {
  const client = await getClient();
  const { data } = await client.post(`/erp/v1/hrm/docs/${userId}`, {
    employee_id: userId,
    dir_name: dirName,
    parent_id: parentId,
  });
  return data;
}

export async function deleteDocument(userId: number, targetId: number) {
  const client = await getClient();
  await client.delete(`/erp/v1/hrm/docs/${userId}/file/${targetId}`);
}

export async function searchDocuments(userId: number, searchKey: string) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/docs/${userId}/search`, {
    params: { search_key: searchKey },
  });
  return data;
}

// ─── Reimbursement ───

export async function getMyReimbursements(
  peopleId: number,
  page = 1
): Promise<PaginatedResponse<any>> {
  const client = await getClient();
  const { data, headers } = await client.get(
    '/erp/v1/accounting/v1/employee-requests',
    { params: { people_id: peopleId, page, per_page: 20, include: 'created_by' } }
  );
  return { data, ...extractPagination(headers) };
}

export async function submitReimbursement(payload: {
  trn_date: string;
  due_date?: string;
  reference?: string;
  line_items: { description: string; amount: number }[];
  amount_total: number;
  particulars?: string;
}) {
  const client = await getClient();
  const { data } = await client.post(
    '/erp/v1/accounting/v1/employee-requests',
    payload
  );
  return data;
}

export async function getReimbursementDetail(id: number) {
  const client = await getClient();
  const { data } = await client.get(
    `/erp/v1/accounting/v1/employee-requests/${id}`
  );
  return data;
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}): Promise<{ success: boolean; message: string }> {
  const client = await getClient();
  const { data } = await client.post('/erp-app/v1/user/change-password', payload);
  return data;
}
