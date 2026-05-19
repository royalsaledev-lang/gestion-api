import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Priority, ProjectStatus } from 'generated/prisma/enums';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsEnum(Priority)
  priority: Priority;

  @IsOptional()
  clientId?: string;

  @IsOptional()
  managerId?: string;
}
