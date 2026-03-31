// Auth & User
export interface Credentials {
  siteUrl: string;
  username: string;
  appPassword: string;
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
