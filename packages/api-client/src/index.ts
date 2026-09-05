import type {
  AuthResponse,
  EmployeeProfile,
  AttendanceRecord,
  AttendanceSummaryPage,
  AttendanceWithEmployee,
  TodayAttendance,
  Paginated,
  EmployeeSortField,
  AttendanceSortField,
  SortDir,
  Role,
} from "@dexago/shared";

export * from "@dexago/shared";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public raw?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface UpdateProfileInput {
  phone?: string;
  password?: string;
}

export interface UpsertEmployeeInput {
  name: string;
  email: string;
  position: string;
  phone?: string;
  password?: string;
  role?: Role;
}

export interface AttendanceQuery {
  from?: string;
  to?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
  sort?: AttendanceSortField;
  dir?: SortDir;
}

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: EmployeeSortField;
  dir?: SortDir;
}

export interface AttendanceSummaryQuery {
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

const TOKEN_KEY = "dexago_token";

export interface ApiClient {
  baseUrl: string;
  getToken(): string | null;
  setToken(token: string | null): void;
  setUnauthorizedHandler(handler: (() => void) | null): void;
  login(email: string, password: string): Promise<AuthResponse>;
  logout(): void;
  me(): Promise<EmployeeProfile>;
  updateProfile(input: UpdateProfileInput): Promise<EmployeeProfile>;
  uploadPhoto(file: File): Promise<EmployeeProfile>;
  checkIn(): Promise<AttendanceRecord>;
  checkOut(): Promise<AttendanceRecord>;
  todayAttendance(): Promise<TodayAttendance>;
  summary(params?: AttendanceSummaryQuery): Promise<AttendanceSummaryPage>;
  listEmployees(query?: EmployeeListQuery): Promise<Paginated<EmployeeProfile>>;
  createEmployee(input: UpsertEmployeeInput): Promise<EmployeeProfile>;
  updateEmployee(
    id: string,
    input: Partial<UpsertEmployeeInput>,
  ): Promise<EmployeeProfile>;
  deleteEmployee(id: string): Promise<{ id: string }>;
  allAttendance(
    query?: AttendanceQuery,
  ): Promise<Paginated<AttendanceWithEmployee>>;
  notificationsUrl(): string;
}

export function createApiClient(baseUrl: string): ApiClient {
  const base = baseUrl.replace(/\/$/, "");
  let token: string | null =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;

  function setToken(t: string | null) {
    token = t;
    if (typeof localStorage === "undefined") return;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  let onUnauthorized: (() => void) | null = null;

  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    const isForm = options.body instanceof FormData;
    if (!isForm && options.body) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${base}${path}`, { ...options, headers });
    } catch (e) {
      throw new ApiError("Network error - is the API running?", 0, e);
    }

    if (!res.ok) {
      if (res.status === 401 && path !== "/auth/login") {
        setToken(null);
        onUnauthorized?.();
      }

      let message = res.statusText;
      let raw: unknown;
      try {
        raw = await res.json();
        const m = (raw as any)?.message;
        message = Array.isArray(m) ? m.join(", ") : (m ?? message);
      } catch {}
      throw new ApiError(message, res.status, raw);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  function qs(params: Record<string, string | undefined>): string {
    const entries = Object.entries(params).filter(([, v]) => v);
    if (!entries.length) return "";
    return (
      "?" +
      entries
        .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
        .join("&")
    );
  }

  return {
    baseUrl: base,
    getToken: () => token,
    setToken,
    setUnauthorizedHandler(handler) {
      onUnauthorized = handler;
    },

    async login(email, password) {
      const res = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      return res;
    },
    logout() {
      setToken(null);
    },
    me() {
      return request<EmployeeProfile>("/auth/me");
    },

    updateProfile(input) {
      return request<EmployeeProfile>("/employees/me/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    uploadPhoto(file) {
      const maxSizeInBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        throw new Error("File is too large! Maximum allowed size is 2 MB.");
      }

      const form = new FormData();
      form.append("photo", file);
      return request<EmployeeProfile>("/employees/me/photo", {
        method: "POST",
        body: form,
      });
    },

    checkIn() {
      return request<AttendanceRecord>("/attendance/check-in", {
        method: "POST",
      });
    },
    checkOut() {
      return request<AttendanceRecord>("/attendance/check-out", {
        method: "POST",
      });
    },
    todayAttendance() {
      return request<TodayAttendance>("/attendance/today");
    },
    summary(params = {}) {
      return request<AttendanceSummaryPage>(
        `/attendance/summary${qs({
          from: params.from,
          to: params.to,
          cursor: params.cursor,
          limit: params.limit != null ? String(params.limit) : undefined,
        })}`,
      );
    },

    listEmployees(query = {}) {
      return request<Paginated<EmployeeProfile>>(
        `/employees${qs({
          page: query.page != null ? String(query.page) : undefined,
          limit: query.limit != null ? String(query.limit) : undefined,
          search: query.search,
          sort: query.sort,
          dir: query.dir,
        })}`,
      );
    },
    createEmployee(input) {
      return request<EmployeeProfile>("/employees", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    updateEmployee(id, input) {
      return request<EmployeeProfile>(`/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    deleteEmployee(id) {
      return request<{ id: string }>(`/employees/${id}`, { method: "DELETE" });
    },
    allAttendance(query = {}) {
      return request<Paginated<AttendanceWithEmployee>>(
        `/attendance/all${qs({
          from: query.from,
          to: query.to,
          employeeId: query.employeeId,
          page: query.page != null ? String(query.page) : undefined,
          limit: query.limit != null ? String(query.limit) : undefined,
          sort: query.sort,
          dir: query.dir,
        })}`,
      );
    },

    notificationsUrl() {
      return `${base}/notifications/stream?token=${encodeURIComponent(token ?? "")}`;
    },
  };
}
