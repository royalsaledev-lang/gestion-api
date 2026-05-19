import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientStatus } from 'generated/prisma/enums';

export class QueryClientDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
