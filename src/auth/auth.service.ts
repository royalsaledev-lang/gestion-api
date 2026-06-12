import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from 'generated/prisma/enums';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(data: RegisterDto, creatorRole: UserRole) {
    const allowedRoles: Record<UserRole, UserRole[]> = {
      ADMIN: ['MANAGER', 'PRESTATAIRE', 'EXECUTANT'],

      MANAGER: ['PRESTATAIRE', 'EXECUTANT'],

      PRESTATAIRE: ['EXECUTANT'],

      EXECUTANT: [],
    };

    const allowed = allowedRoles[creatorRole];

    if (!allowed.includes(data.role)) {
      throw new Error(`Role ${creatorRole} cannot create ${data.role}`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });
  }

  async login(data: LoginDto) {
    try {
      console.log('LOGIN DATA:', data);
      console.log(
        'EMAIL FIELD:',
        (data as any)?.email,
        'type:',
        typeof (data as any)?.email,
      );

      if (!data?.email || typeof data.email !== 'string') {
        throw new Error('Email manquant ou invalide');
      }

      console.log('PRISMA USER EXISTS?', !!this.prisma?.user);

      const user = await this.prisma.user.findUnique({
        where: { email: data.email.trim().toLowerCase() },
      });

      console.log('USER FOUND:', user);

      // 🔥 1. check existence + actif
      if (!user || !user.password || !user.active) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 🔥 2. check password
      const isMatch = await bcrypt.compare(data.password, user.password);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 🔥 3. generate tokens
      const tokens = await this.generateTokens(user);

      // 🔥 4. store refresh token hash
      const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefresh },
      });

      return tokens;
    } catch (error) {
      // 🔥 IMPORTANT: log complet Prisma (pas seulement message)
      console.error('❌ LOGIN ERROR FULL:', error);

      // Prisma error details (TRÈS utile)
      if (error?.meta) {
        console.error('PRISMA META:', error.meta);
      }

      if (error?.stack) {
        console.error('STACK TRACE:', error.stack);
      }

      // erreurs métier
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message || JSON.stringify(error) || 'Login failed',
      );
    }
  }

  async refreshToken(refreshToken: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(user);

    // 🔄 rotation
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return tokens;
  }

  async generateTokens(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getUser(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 🔒 sécurité : ne jamais dire si user existe ou pas
    if (!user) {
      return {
        message:
          'Si cet e-mail existe, un lien de réinitialisation a été envoyé.',
      };
    }

    const token = this.jwtService.sign(
      {
        userId: user.id,
        role: user.role,
        type: 'reset',
        jti: uuidv4(), // évite replay simple
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );

    const resetLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset your password',
      template: 'reset-password', // 👈 recommandé
      context: {
        name: user.name,
        resetLink,
        year: new Date().getFullYear(),
      },
    });

    return { message: 'Lien de réinitialisation envoyé' };
  }

  async resetPassword(token: string, password: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 🔒 sécurité : vérifier type
    if (payload.type !== 'reset') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
      },
    });

    return { message: 'Mot de passe mis à jour avec succèss' };
  }
}
