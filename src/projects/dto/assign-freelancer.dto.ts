import { IsString } from 'class-validator';
export class AssignFreelancerDto {
  @IsString()
  freelancerId: string;
}
