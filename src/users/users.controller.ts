import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { RolesGuard } from '../core/permissions/roles.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/core/permissions/role.decorator';
import { CurrentUser } from 'src/core/permissions/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Req() req, @CurrentUser() user) {
    console.log('utilisateur', user.userId);

    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() data: CreateUserDto, @CurrentUser() user) {
    return this.usersService.createUser(
      data,
      user.userId,
      user.role, // 🔥 IMPORTANT
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @CurrentUser() user,
  ) {
    return this.usersService.updateUser(id, data, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/deactivate')
  @Roles('ADMIN', 'MANAGER')
  deactivate(@Param('id') id: string, @CurrentUser() user) {
    return this.usersService.toggleUserStatus(id, user.userId);
  }

  // users.controller.ts

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  getMe(@CurrentUser() user) {
    return this.usersService.findOne(user.userId);
  }
}
