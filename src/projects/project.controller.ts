import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignFreelancerDto } from './dto/assign-freelancer.dto';
import { ProjectsService } from './project.service';
import { CurrentUser } from 'src/core/permissions/current-user.decorator';
import { Roles } from 'src/core/permissions/role.decorator';
import { RolesGuard } from 'src/core/permissions/roles.guard';
import { QueryProjectDto } from './dto/query-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() data: CreateProjectDto, @CurrentUser() user) {
    return this.projectsService.createProject(data, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  findAll(@Query() query: QueryProjectDto, @CurrentUser() user) {
    return this.projectsService.findAllProject(user, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body() data: UpdateProjectDto,
    @CurrentUser() user,
  ) {
    return this.projectsService.updateProject(id, data, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/freelancers')
  @Roles('ADMIN', 'MANAGER')
  assignFreelancer(
    @Param('id') projectId: string,
    @Body() dto: AssignFreelancerDto,
  ) {
    return this.projectsService.assignFreelancer(projectId, dto.freelancerId);
  }
}
