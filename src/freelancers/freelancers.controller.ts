import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';

import { FreelancersService } from './freelancers.service';

import { CreateFreelancerDto } from './dto/create-freelancer.dto';
import { UpdateFreelancerDto } from './dto/update-freelancer.dto';
import { AddMemberDto } from './dto/add-member.dto';

import { RolesGuard } from '../core/permissions/roles.guard';

import { CurrentUser } from '../core/permissions/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/core/permissions/role.decorator';
import { QueryFreelancerDto } from './dto/query-freelancer.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('freelancers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FreelancersController {
  constructor(private service: FreelancersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query() query: QueryFreelancerDto) {
    return this.service.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() data: CreateFreelancerDto, @CurrentUser() user: any) {
    return this.service.createFreelancer(data, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateFreelancerDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFreelancer(id, data, user.userId);
  }

  // prestataire peut ajouter son équipe
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() data: AddMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.service.addMember(id, data, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post(':id/assign/:projectId')
  assignToProject(
    @Param('id') freelancerId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user,
  ) {
    return this.service.assignToProject(projectId, freelancerId, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getFreelancerFull(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  // DELETE FREELANCER
  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  delete(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.service.deleteFreelancer(id, user.userId);
  }

  // REMOVE MEMBER
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('members/:memberId')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  removeMember(
    @Param('memberId') memberId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.removeMember(memberId, user.userId);
  }

  // UNASSIGN PROJECT
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id/unassign/:projectId')
  @Roles('ADMIN', 'MANAGER')
  unassignFromProject(
    @Param('id') freelancerId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.unassignFromProject(
      freelancerId,
      projectId,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('members/:id')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  updateMember(
    @Param('id') id: string,
    @Body() data: UpdateMemberDto,
    @CurrentUser() user,
  ) {
    return this.service.updateMember(id, data, user.id);
  }

  // freelancers.controller.ts

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/members')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  getMembers(@Param('id') freelancerId: string) {
    return this.service.getMembers(freelancerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('members/:memberId')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  getMember(
    @Param('memberId') memberId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.getMember(memberId, user.userId);
  }
}
