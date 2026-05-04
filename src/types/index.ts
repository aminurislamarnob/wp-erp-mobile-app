// Auth & User
export interface Credentials {
  siteUrl: string;
  username: string;
  password: string;
  token: string;
}

export interface WPUser {
  id: number;
  name: string;
  slug: string;
  roles: string[];
  avatar_urls?: Record<string, string>;
}

export interface Employee {
  user_id: number;
  employee_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
  blood_group: string;
  phone: string;
  mobile: string;
  work_phone: string;
  other_email: string;
  address: string;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  driving_license: string;
  hobbies: string;
  description: string;
  user_url: string;
  location: string;
  type: string;
  status: string;
  hiring_source: string;
  avatar_url?: string;
  department?: Department;
  designation?: Designation;
  reporting_to?: Employee;
}

export interface Department {
  id: number;
  title: string;
  description: string;
  lead: number;
  parent: number;
}

export interface Designation {
  id: number;
  title: string;
  description: string;
}

// Leave
export interface LeaveRequest {
  id: number;
  user_id: number;
  employee_id: number;
  employee_name: string;
  avatar_url: string;
  status: number;
  start_date: string;
  end_date: string;
  reason: string;
  comments: string;
  message?: string;
  required_approval?: {
    approver_id: number;
    approver_name: string;
    status: string;
  } | null;
  days?: number;
  available?: number;
  spent?: number;
  entitlement?: number;
  policy?: LeavePolicy;
}

export interface LeavePolicy {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface LeaveEntitlement {
  id: number;
  policy_id: number;
  policy_name: string;
  total: number;
  used: number;
  remaining: number;
}

export interface Holiday {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description: string;
}

// Attendance
export interface AttendanceLog {
  id: number;
  user_id: number;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
}

export interface SelfAttendance {
  ds_id: string;
  log_id: string;
  shift_title: string;
  ds_start_time: string;
  ds_end_time: string;
  log_time: string;
  min_checkin: string;
  max_checkout: string;
}

export interface SelfAttendanceLog {
  ds_id: string;
  log_id: string;
  log_time: string;
  shift_title: string;
  start_time: string;
  ds_start_time: string;
  end_time: string;
  ds_end_time: string;
  min_checkin: string;
  max_checkin_unix: string;
  curnt_timestamp_unx: string;
  max_checkout: string;
  curnt_timestamp: number;
  max_checkin: number;
}

export interface AttendanceReportDay {
  date: string;
  checkin: number | string;
  checkout: number | string;
  worktime: number | string;
  late_time: number | string | null;
  earlyleft_time: number | string | null;
  shift: string;
  start: number | string;
  end: number | string;
  status: string;
  overtime: number | string;
}

export interface AttendanceReportSummary {
  dates: number;
  working_days: number;
  present: number;
  leaves: number;
  absent: number;
  holidays: number;
  missing_checkout: number;
  late: number;
  early_left: number;
  avg_checkin: number;
  avg_checkout: number;
  avg_worktime: number;
  worktime: number;
  overtime: number;
  percentage: number;
}

// Announcement
export interface Announcement {
  id: number;
  title: string;
  body: string;
  status: string;
  date: string;
  author: string;
}

// Birthday
export interface Birthday {
  id: number;
  user_id: number;
  employee_id: string;
  date_of_birth: string;
  birthday: string;
  name: string;
  avatar: string;
  job_title: string;
  department_title: string;
  url: string;
}

// Calendar Event
export interface CalendarEvent {
  id: number;
  start: string;
  end: string;
  title: string;
  color: string;
  holiday: boolean;
}

// ERP Pro Module
export interface ERPModule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  available: boolean;
}

// Document
export interface Document {
  id: number;
  name: string;
  type: 'file' | 'folder';
  parent_id: number;
  children?: Document[];
}

// Reimbursement
export interface ReimbursementRequest {
  id: number;
  people_id: number;
  people_name: string;
  amount_total: number;
  trn_date: string;
  reference: string;
  line_items: ReimbursementLineItem[];
  particulars: string;
  attachments: string[];
  status: { id: number; name: string };
  created_at: string;
}

export interface ReimbursementLineItem {
  description: string;
  amount: number;
}

// API Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
}

// ─── Personal Notes (erp-app/v1) ───
export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteAttachment {
  id: number;
  url: string;
  filename?: string;
  mime_type?: string;
  size?: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  labels: Label[];
  attachments: NoteAttachment[];
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteListFilters {
  search?: string;
  label_ids?: number[];
  date_from?: string;
  date_to?: string;
  pinned?: boolean;
  archived?: boolean;
  page?: number;
  per_page?: number;
}
