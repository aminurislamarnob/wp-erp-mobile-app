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
    params: { upcoming: true },
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
    comments: raw.comments || raw.message || '',
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
    params: { type: 'upcoming' },
  });
  return data;
}

// ─── Holidays ───

export async function getHolidays(): Promise<Holiday[]> {
  const client = await getClient();
  const { data } = await client.get('/erp/v1/hrm/leaves/holidays', {
    params: { per_page: 100 },
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

export async function getMyAnnouncements(
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<Announcement>> {
  const client = await getClient();
  const { data, headers } = await client.get('/erp/v1/hrm/announcements/my', {
    params: { page, per_page: perPage },
  });
  return { data, ...extractPagination(headers) };
}

export async function getAnnouncementDetail(id: number): Promise<Announcement> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/announcements/my/${id}`);
  return data;
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
