import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FreelancerStatus } from 'generated/prisma/enums';

export class QueryFreelancerDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(FreelancerStatus)
  status?: FreelancerStatus;
}
