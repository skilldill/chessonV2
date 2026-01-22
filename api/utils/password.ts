import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Хеширует пароль с использованием bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверяет пароль с захешированным паролем
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
