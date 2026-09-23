export type Team = {
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  role: string;

  favoriteTeam: {
    slug: string;
    name: string;
    shortName: string | null;
    logoUrl?: string | null;
  } | null;
};

type ApiError = {
  success?: false;
  message?: string;
};

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/tribun${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },

    cache: "no-store",
  });

  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    const error = data as ApiError;

    throw new Error(
      error.message ?? "Beklenmeyen bir hata oluştu.",
    );
  }

  return data as T;
}

export async function getCurrentUser() {
  return request<{
    success: true;
    user: AuthUser;
  }>("/auth/me");
}

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
  favoriteTeamSlug: string;
}) {
  return request<{
    success: true;
    user: AuthUser;
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: {
  identifier: string;
  password: string;
}) {
  return request<{
    success: true;
    user: AuthUser;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logoutUser() {
  return request<{
    success: true;
  }>("/auth/logout", {
    method: "POST",
  });
}

export async function getTeams() {
  return request<{
    success: true;
    teams: Team[];
  }>("/teams");
}