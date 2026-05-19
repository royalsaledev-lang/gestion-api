import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RolesGuard } from 'src/core/permissions/roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from 'src/core/permissions/role.decorator';
import { CurrentUser } from 'src/core/permissions/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  @Post('register')
  register(@Body() data: RegisterDto, @CurrentUser() user) {
    return this.authService.register(data, user.role);
  }

  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req) {
    return this.authService.getUser(req.user.userId);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('forgot-password')
  forgot(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  reset(@Body('token') token: string, @Body('password') password: string) {
    return this.authService.resetPassword(token, password);
  }
}
