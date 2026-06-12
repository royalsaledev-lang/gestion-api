import { IsUUID } from 'class-validator';

export class AssignParticipantDto {
  @IsUUID()
  userId: string;
}
