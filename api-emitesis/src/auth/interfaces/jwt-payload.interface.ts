export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
  fullName: string;
  iat?: number;
  exp?: number;
}
