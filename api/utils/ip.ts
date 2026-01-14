/**
 * Извлекает IP адрес из запроса
 * Учитывает заголовки X-Forwarded-For и X-Real-IP для работы за прокси
 */
export function getClientIP(request: Request): string {
  // Проверяем заголовок X-Forwarded-For (может содержать несколько IP через запятую)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Берем первый IP из списка
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // Проверяем заголовок X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Если заголовки не найдены, возвращаем localhost (для разработки)
  return '127.0.0.1';
}
