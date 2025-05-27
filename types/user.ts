export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  passwordHash: string;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateUserInput {
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  password?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  isSuspended?: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PasswordResetInput {
  email: string;
}

export interface PasswordResetCompleteInput {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  redirectTo?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Types for NextAuth
export interface UserSession {
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: UserRole;
  };
}

export interface TokenSet {
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  [key: string]: any;
}

export interface SessionParams {
  session: UserSession;
  token: TokenSet;
}

export interface JWTParams {
  token: TokenSet;
  user?: User;
}