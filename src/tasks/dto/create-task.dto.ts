import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Priority, TaskStatus } from 'generated/prisma/enums';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsEnum(Priority)
  priority: Priority;

  @IsString()
  projectId: string;

  @IsOptional()
  assignedToId?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  deadline?: Date;
}
