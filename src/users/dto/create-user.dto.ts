import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from 'generated/prisma/enums';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
