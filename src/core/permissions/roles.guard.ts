import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // ✅ aucune restriction
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 🔥 DEBUG
    console.log('RolesGuard user:', user);
    console.log('Required roles:', roles);

    // ❌ utilisateur non injecté
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // ❌ role manquant
    if (!user.role) {
      throw new ForbiddenException('User role missing');
    }

    // ❌ rôle non autorisé
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}

// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

// import { Reflector } from '@nestjs/core';
// import { ROLES_KEY } from './role.decorator';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (!roles) return true;

//     const request = context.switchToHttp().getRequest();

//     const user = request.user;

//     return roles.includes(user?.role);
//   }
// }
