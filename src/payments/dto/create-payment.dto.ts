import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from 'generated/prisma/enums';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  projectId: string;
}
