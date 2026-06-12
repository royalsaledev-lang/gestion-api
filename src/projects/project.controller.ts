import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignParticipantDto } from './dto/assign-participant.dto';

import { ProjectsService } from './project.service';

import { CurrentUser } from 'src/core/permissions/current-user.decorator';
import { Roles } from 'src/core/permissions/role.decorator';
import { RolesGuard } from 'src/core/permissions/roles.guard';

import { QueryProjectDto } from './dto/query-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() data: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.createProject(data, user.userId);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  findAll(@Query() query: QueryProjectDto, @CurrentUser() user: any) {
    return this.projectsService.findAllProject(user, query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body() data: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.updateProject(id, data, user.userId);
  }

  // ===============================
  // PARTICIPANTS
  // ===============================

  @Post(':id/participants')
  @Roles('ADMIN', 'MANAGER')
  assignParticipant(
    @Param('id') projectId: string,
    @Body() dto: AssignParticipantDto,
  ) {
    return this.projectsService.assignParticipant(projectId, dto.userId);
  }

  @Delete(':id/participants/:userId')
  @Roles('ADMIN', 'MANAGER')
  removeParticipant(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeParticipant(projectId, userId);
  }

  @Get(':id/participants')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  getParticipants(@Param('id') projectId: string) {
    return this.projectsService.getParticipants(projectId);
  }
}
