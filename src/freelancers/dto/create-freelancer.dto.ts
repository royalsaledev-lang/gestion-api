import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { FreelancerStatus } from 'generated/prisma/enums';

export class CreateFreelancerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsEnum(FreelancerStatus)
  status: FreelancerStatus;
}
