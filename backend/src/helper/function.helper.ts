import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { User } from 'src/entities/user.entity';

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generatePassword(length = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(length);

  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

export function signToken(user: User, jwtService: JwtService) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    access_token: jwtService.sign(payload),
    user: user,
  };
}
