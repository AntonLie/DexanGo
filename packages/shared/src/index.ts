export const Role = {
  EMPLOYEE: "EMPLOYEE",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AttendanceStatus = {
  IN: "IN",
  OUT: "OUT",
} as const;
export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const AUDIT_LOG_QUEUE = "audit-log";

export const AUDIT_LOG_JOB = "record-audit";

export const AuditAction = {
  PROFILE_PHOTO_UPDATED: "PROFILE_PHOTO_UPDATED",
  PROFILE_PHONE_UPDATED: "PROFILE_PHONE_UPDATED",
  PROFILE_PASSWORD_UPDATED: "PROFILE_PASSWORD_UPDATED",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export interface AuditLogEvent {
  action: AuditAction;
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  message: string;
  changes?: Record<string, { from?: unknown; to?: unknown }>;
  occurredAt: string;
}

export interface AdminNotification {
  id: string;
  action: AuditAction;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  message: string;
  occurredAt: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string | null;
  photoUrl: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  status: AttendanceStatus;
  timestamp: string;
  date: string;
}

export interface AttendanceSummaryRow {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export interface AttendanceSummaryPage {
  rows: AttendanceSummaryRow[];
  nextCursor: string | null;
}

export interface AttendanceWithEmployee extends AttendanceRecord {
  employeeName: string;
  employeeEmail: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type EmployeeSortField =
  | "name"
  | "email"
  | "position"
  | "role"
  | "createdAt";
export type SortDir = "asc" | "desc";

export type AttendanceSortField = "employeeName" | "status" | "timestamp";

export interface TodayAttendance {
  date: string;
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: EmployeeProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  phone?: string;
  password?: string;
}

export interface UpsertEmployeeRequest {
  name: string;
  email: string;
  position: string;
  phone?: string;
  password?: string;
  role?: Role;
}
