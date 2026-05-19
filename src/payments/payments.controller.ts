import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { RolesGuard } from '../core/permissions/roles.guard';
import { CurrentUser } from '../core/permissions/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/core/permissions/role.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() data: CreatePaymentDto, @CurrentUser() user: any) {
    return this.service.createPayment(data, user.id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePayment(id, data, user.id);
  }

  @Get('project/:projectId')
  getProjectPayments(@Param('projectId') projectId: string) {
    return this.service.getProjectPayments(projectId);
  }

  @Get('stats')
  getStats() {
    return this.service.getFinanceStats();
  }

  @Get('revenue-chart')
  getRevenueChart() {
    return this.service.getRevenueByMonth();
  }
}
