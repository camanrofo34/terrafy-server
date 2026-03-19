import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('JWT secret not configured');

    try {
      const decoded = jwt.verify(token, secret);
      (req as any).user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
