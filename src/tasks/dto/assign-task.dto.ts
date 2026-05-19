import { IsString } from 'class-validator';

export class AssignTaskDto {
  @IsString()
  userId: string;
}
