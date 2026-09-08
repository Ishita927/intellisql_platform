// const API_URL = process.env.NEXT_PUBLIC_API_URL;

// export interface RegisterPayload {
//   company_name: string;
//   name: string;
//   email: string;
//   password: string;
// }

// export interface LoginPayload {
//   email: string;
//   password: string;
// }

// export interface User {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
//   tenant_id: number;
// }

// async function handleResponse(res: Response) {
//   if (!res.ok) {
//     const body = await res.json().catch(() => ({}));
//     throw new Error(body.detail || `Request failed with ${res.status}`);
//   }
//   return res.json();
// }

// export async function registerTenant(payload: RegisterPayload) {
//   const res = await fetch(`${API_URL}/auth/register`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   return handleResponse(res);
// }

// export async function login(payload: LoginPayload): Promise<{ access_token: string }> {
//   const res = await fetch(`${API_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   return handleResponse(res);
// }

// export async function getMe(token: string): Promise<User> {
//   const res = await fetch(`${API_URL}/auth/me`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return handleResponse(res);
// }

// export interface DbConnectionPayload {
//   host: string;
//   port: number;
//   database_name: string;
//   username: string;
//   password: string;
// }

// export interface DbConnectionResult {
//   id: number;
//   tenant_id: number;
//   host: string;
//   port: number;
//   database_name: string;
//   username: string;
// }

// export interface TestResult {
//   success: boolean;
//   message: string;
// }

// export interface ColumnInfo {
//   name: string;
//   type: string;
//   is_primary_key: boolean;
// }

// export interface ForeignKeyInfo {
//   column: string;
//   references_table: string;
//   references_column: string;
// }

// export interface TableSchema {
//   name: string;
//   columns: ColumnInfo[];
//   foreign_keys: ForeignKeyInfo[];
// }

// export interface SchemaScanResult {
//   database_id: number;
//   tables: TableSchema[];
// }

// export async function testDatabaseConnection(
//   token: string,
//   payload: DbConnectionPayload
// ): Promise<TestResult> {
//   const res = await fetch(`${API_URL}/databases/test`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//   });
//   return handleResponse(res);
// }

// export async function saveDatabaseConnection(
//   token: string,
//   payload: DbConnectionPayload
// ): Promise<DbConnectionResult> {
//   const res = await fetch(`${API_URL}/databases/`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//   });
//   return handleResponse(res);
// }

// export async function scanDatabaseSchema(
//   token: string,
//   databaseId: number
// ): Promise<SchemaScanResult> {
//   const res = await fetch(`${API_URL}/databases/${databaseId}/scan-schema`, {
//     method: "POST",
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return handleResponse(res);
// }

// export interface AskResult {
//   question: string;
//   generated_sql: string;
//   columns: string[];
//   rows: any[][];
//   row_count: number;
// }

// export async function askQuestion(
//   token: string,
//   databaseId: number,
//   question: string
// ): Promise<AskResult> {
//   const res = await fetch(`${API_URL}/query/ask`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({ database_id: databaseId, question }),
//   });
//   return handleResponse(res);
// }

// export async function listDatabaseConnections(
//   token: string
// ): Promise<DbConnectionResult[]> {
//   const res = await fetch(`${API_URL}/databases/`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return handleResponse(res);
// }

// export interface InvitePayload {
//   name: string;
//   email: string;
//   password: string;
//   role?: string;
// }

// export async function inviteEmployee(token: string, payload: InvitePayload) {
//   const res = await fetch(`${API_URL}/users/invite`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//   });
//   return handleResponse(res);
// }

// export async function listCompanyUsers(token: string) {
//   const res = await fetch(`${API_URL}/users/`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return handleResponse(res);
// }

// export interface InvitePayload {
//   name: string;
//   email: string;
//   password: string;
//   role?: string;
// }

// export interface CompanyUser {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
//   tenant_id: number;
// }

// export async function inviteEmployee(token: string, payload: InvitePayload): Promise<CompanyUser> {
//   const res = await fetch(`${API_URL}/users/invite`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//   });
//   return handleResponse(res);
// }

// export async function listCompanyUsers(token: string): Promise<CompanyUser[]> {
//   const res = await fetch(`${API_URL}/users/`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return handleResponse(res);
// }

// export async function listDatabaseConnections(
//   token: string
// ): Promise<DbConnectionResult[]> {
//   const res = await fetch(`${API_URL}/databases/`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return handleResponse(res);
// }

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface RegisterPayload {
  company_name: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with ${res.status}`);
  }
  return res.json();
}

export async function registerTenant(payload: RegisterPayload) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function login(payload: LoginPayload): Promise<{ access_token: string }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ---------- Database connections ----------

export interface DbConnectionPayload {
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
}

export interface DbConnectionResult {
  id: number;
  tenant_id: number;
  host: string;
  port: number;
  database_name: string;
  username: string;
}

export interface TestResult {
  success: boolean;
  message: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  is_primary_key: boolean;
}

export interface ForeignKeyInfo {
  column: string;
  references_table: string;
  references_column: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  foreign_keys: ForeignKeyInfo[];
}

export interface SchemaScanResult {
  database_id: number;
  tables: TableSchema[];
}

export async function testDatabaseConnection(
  token: string,
  payload: DbConnectionPayload
): Promise<TestResult> {
  const res = await fetch(`${API_URL}/databases/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function saveDatabaseConnection(
  token: string,
  payload: DbConnectionPayload
): Promise<DbConnectionResult> {
  const res = await fetch(`${API_URL}/databases/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function scanDatabaseSchema(
  token: string,
  databaseId: number
): Promise<SchemaScanResult> {
  const res = await fetch(`${API_URL}/databases/${databaseId}/scan-schema`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function listDatabaseConnections(
  token: string
): Promise<DbConnectionResult[]> {
  const res = await fetch(`${API_URL}/databases/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ---------- Query / Text-to-SQL ----------

export interface GenerateSQLResult {
  question: string;
  generated_sql: string;
}

export async function generateSQL(
  token: string,
  databaseId: number,
  question: string
): Promise<GenerateSQLResult> {
  const res = await fetch(`${API_URL}/query/generate-sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ database_id: databaseId, question }),
  });
  return handleResponse(res);
}

export interface AskResult {
  status: "COMPLETE" | "NEEDS_CLARIFICATION";
  question: string;
  generated_sql?: string;
  columns?: string[];
  rows?: any[][];
  row_count?: number;
  conversation_id?: number;
  clarification_question?: string;
  clarification_options?: string[];
}

export async function askQuestion(
  token: string,
  databaseId: number,
  question: string
): Promise<AskResult> {
  const res = await fetch(`${API_URL}/query/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ database_id: databaseId, question }),
  });
  return handleResponse(res);
}

export async function clarifyQuestion(
  token: string,
  conversationId: number,
  answer: string
): Promise<AskResult> {
  const res = await fetch(`${API_URL}/query/clarify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversation_id: conversationId, answer }),
  });
  return handleResponse(res);
}

// ---------- Team management ----------

export interface InvitePayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface CompanyUser {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

export async function inviteEmployee(
  token: string,
  payload: InvitePayload
): Promise<CompanyUser> {
  const res = await fetch(`${API_URL}/users/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function listCompanyUsers(token: string): Promise<CompanyUser[]> {
  const res = await fetch(`${API_URL}/users/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}
