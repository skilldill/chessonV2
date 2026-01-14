import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SECRET = new TextEncoder().encode(SECRET_KEY);

const JWT_EXPIRES_IN = '7d'; // Токен действителен 7 дней

export interface JWTPayload {
  userId: string;
  login: string;
}

/**
 * Создает JWT токен
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(SECRET);

  return token;
}

/**
 * Проверяет и декодирует JWT токен
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}
