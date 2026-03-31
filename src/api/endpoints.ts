import { getClient, extractPagination } from './client';
import {
  Employee,
  Birthday,
  LeaveRequest,
  Holiday,
  CalendarEvent,
  Announcement,
  AttendanceLog,
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
    params: { page, per_page: perPage, status: 'active', search },
  });
  return { data, ...extractPagination(headers) };
}

export async function getMyExperiences(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/experiences`);
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

// ─── Birthdays ───

export async function getUpcomingBirthdays(): Promise<Birthday[]> {
  const client = await getClient();
  const { data } = await client.get('/erp/v1/hrm/birthdays', {
    params: { upcoming: true },
  });
  return data;
}

// ─── Leave ───

export async function getMyLeaveRequests(
  userId: number,
  params?: { status?: number; type?: string; page?: number }
): Promise<PaginatedResponse<LeaveRequest>> {
  const client = await getClient();
  const { data, headers } = await client.get('/erp/v1/hrm/leaves/requests', {
    params: { user_id: userId, include: 'policy', ...params },
  });
  return { data, ...extractPagination(headers) };
}

export async function getLeaveRequestDetail(id: number): Promise<LeaveRequest> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/leaves/requests/${id}`, {
    params: { include: 'policy' },
  });
  return data;
}

export async function submitLeaveRequest(payload: {
  user_id: number;
  leave_policy: number;
  start_date: string;
  end_date: string;
  reason: string;
}): Promise<LeaveRequest> {
  const client = await getClient();
  const { data } = await client.post('/erp/v1/hrm/leaves/requests', payload);
  return data;
}

export async function getMyLeavePolicies(userId: number): Promise<LeavePolicy[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/policies`);
  return data;
}

export async function getMyLeaveBalance(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/employees/${userId}/leaves`);
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
    params: { start: `${year}-01-01`, end: `${year}-12-31` },
  });
  return data;
}

// ─── Attendance ───

export async function clockInOut(): Promise<AttendanceLog> {
  const client = await getClient();
  try {
    const { data } = await client.post('/erp/v1/hrm/attendance/self-attendance');
    return data;
  } catch {
    // Fallback if self-attendance not available
    const { data } = await client.post('/erp/v1/hrm/attendance/logs');
    return data;
  }
}

export async function getMyAttendanceLogs(userId: number): Promise<AttendanceLog[]> {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/attendance/logs/${userId}`);
  return data;
}

export async function getMyAttendanceReport(userId: number) {
  const client = await getClient();
  const { data } = await client.get(`/erp/v1/hrm/attendance/reports/${userId}`);
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
