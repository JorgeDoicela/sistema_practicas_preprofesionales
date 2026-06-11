export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
  fullName: string;
  careerId?: string | null;
  companyId?: string | null;
  iat?: number;
  exp?: number;
}
