import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ClientStatus } from 'generated/prisma/enums';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsEnum(ClientStatus)
  status: ClientStatus;
}
