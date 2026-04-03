import { Injectable } from '@nestjs/common';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class DashboardService {
  constructor(private readonly financeService: FinanceService) {}

  async getSummary(query: DashboardQueryDto) {
    const where = this.financeService.buildWhereClause({
      category: query.category,
      type: query.type,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return this.financeService.getSummary(where);
  }
}
