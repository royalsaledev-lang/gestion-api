import { PaginationDto } from './pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class QueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
