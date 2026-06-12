import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/permissions/roles.guard';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { Roles } from 'src/core/permissions/role.decorator';
import { CurrentUser } from 'src/core/permissions/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // CREATE TASK
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  create(@Body() data: CreateTaskDto, @CurrentUser() user) {
    return this.tasksService.createTask(data, user.userId, user.role);
  }

  // GET ALL
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  findAll() {
    return this.tasksService.findAll();
  }

  // GET ONE
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // UPDATE
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  update(
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
    @CurrentUser() user,
  ) {
    return this.tasksService.updateTask(id, data, user.userId);
  }

  // ASSIGN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/assign')
  @Roles('ADMIN', 'MANAGER')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user,
  ) {
    return this.tasksService.assignTask(id, dto.userId, user.userId);
  }

  // COMPLETE
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/complete')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
  complete(@Param('id') id: string, @CurrentUser() user) {
    return this.tasksService.completeTask(id, user.userId);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'MANAGER')
  reject(@Param('id') id: string, @CurrentUser() user) {
    return this.tasksService.rejectTask(id, user.userId);
  }
  // FINAL APPROVE MANAGER
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/approve-manager')
  @Roles('ADMIN', 'MANAGER')
  validateManager(@Param('id') id: string, @CurrentUser() user) {
    return this.tasksService.finalApprove(id, user);
  }
}

// @Controller('tasks')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class TasksController {
//   constructor(private tasksService: TasksService) {}

//   @Post()
//   @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
//   create(@Body() data: CreateTaskDto, @CurrentUser() user) {
//     return this.tasksService.createTask(data, user.userId);
//   }

//   @Get()
//   @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE', 'EXECUTANT')
//   findAll() {
//     return this.tasksService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.tasksService.findOne(id);
//   }

//   @Patch(':id')
//   update(
//     @Param('id') id: string,
//     @Body() data: UpdateTaskDto,
//     @CurrentUser() user,
//   ) {
//     return this.tasksService.updateTask(id, data, user.userId);
//   }

//   @Post(':id/assign')
//   @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
//   assign(@Param('id') id: string, @Body() dto: AssignTaskDto) {
//     return this.tasksService.assignTask(id, dto.userId);
//   }

//   @Post(':id/complete')
//   complete(@Param('id') id: string, @CurrentUser() user) {
//     return this.tasksService.completeTask(id, user.userId);
//   }
// }
