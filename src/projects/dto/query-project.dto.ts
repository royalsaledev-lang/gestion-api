import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from 'generated/prisma/enums';

export class QueryProjectDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
