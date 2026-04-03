import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { validateEntityId } from 'src/common/utils/id-validation.util';
import { RecordType } from 'src/common/enums/record-type.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { FinancialRecordQueryDto } from './dto/financial-record-query.dto';
import { UpdateFinancialRecordDto } from './dto/update-financial-record.dto';

interface FinanceFilters {
  category?: string;
  type?: RecordType;
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecord(createFinancialRecordDto: CreateFinancialRecordDto) {
    return this.prisma.financialRecord.create({
      data: {
        amount: createFinancialRecordDto.amount,
        type: createFinancialRecordDto.type,
        category: createFinancialRecordDto.category,
        date: new Date(createFinancialRecordDto.date),
        notes: createFinancialRecordDto.notes,
      },
    });
  }

  async getRecords(query: FinancialRecordQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.financialRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.financialRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateRecord(id: string, updateFinancialRecordDto: UpdateFinancialRecordDto) {
    validateEntityId(id, 'financial record');
    await this.ensureActiveRecordExists(id);

    const data: Record<string, unknown> = {};

    if (updateFinancialRecordDto.amount !== undefined) {
      data.amount = updateFinancialRecordDto.amount;
    }

    if (updateFinancialRecordDto.type !== undefined) {
      data.type = updateFinancialRecordDto.type;
    }

    if (updateFinancialRecordDto.category !== undefined) {
      data.category = updateFinancialRecordDto.category;
    }

    if (updateFinancialRecordDto.date !== undefined) {
      data.date = new Date(updateFinancialRecordDto.date);
    }

    if (updateFinancialRecordDto.notes !== undefined) {
      data.notes = updateFinancialRecordDto.notes;
    }

    return this.prisma.financialRecord.update({
      where: { id },
      data,
    });
  }

  async deleteRecord(id: string) {
    validateEntityId(id, 'financial record');
    const record = await this.ensureRecordExists(id);

    if (record.deletedAt) {
      throw new BadRequestException('Record already deleted');
    }

    await this.prisma.financialRecord.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Financial record deleted successfully.',
    };
  }

  async restoreRecord(id: string) {
    validateEntityId(id, 'financial record');
    const record = await this.ensureRecordExists(id);

    if (!record.deletedAt) {
      throw new BadRequestException('Record is not deleted.');
    }

    return this.prisma.financialRecord.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  buildWhereClause(query: FinanceFilters) {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        (where.date as Record<string, Date>).gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (where.date as Record<string, Date>).lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        {
          notes: {
            contains: query.search,
          },
        },
        {
          category: {
            contains: query.search,
          },
        },
      ];
    }

    return where;
  }

  async getSummary(where: Record<string, unknown> = {}) {
    const activeWhere = {
      deletedAt: null,
      ...where,
    };
    const { clause, params } = this.buildSqlFilters(activeWhere);
    const [incomeAggregate, expenseAggregate, recentTransactions, categoryRows, monthlyRowsRaw] =
      await this.prisma.$transaction([
      this.prisma.financialRecord.aggregate({
        where: { ...activeWhere, type: RecordType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.financialRecord.aggregate({
        where: { ...activeWhere, type: RecordType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.financialRecord.findMany({
        where: activeWhere,
        orderBy: { date: 'desc' },
        take: 5,
      }),
      this.prisma.financialRecord.groupBy({
        where: activeWhere,
        by: ['category', 'type'],
        _sum: { amount: true },
        orderBy: [{ category: 'asc' }, { type: 'asc' }],
      }),
      this.prisma.$queryRawUnsafe(
        `
          SELECT
            strftime('%Y-%m', date) AS month,
            type,
            CAST(SUM(amount) AS REAL) AS total
          FROM "FinancialRecord"
          ${clause}
          GROUP BY strftime('%Y-%m', date), type
          ORDER BY month ASC
        `,
        ...params,
      ),
    ]);
    const monthlyRows = monthlyRowsRaw as Array<{ month: string; type: string; total: number }>;

    const totalIncome = Number(incomeAggregate._sum.amount ?? 0);
    const totalExpense = Number(expenseAggregate._sum.amount ?? 0);
    const monthlyMap = new Map<string, { income: number; expense: number }>();

    for (const row of monthlyRows) {
      const monthEntry = monthlyMap.get(row.month) ?? { income: 0, expense: 0 };
      if (row.type === RecordType.INCOME) {
        monthEntry.income = Number(row.total);
      } else {
        monthEntry.expense = Number(row.total);
      }
      monthlyMap.set(row.month, monthEntry);
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      categoryBreakdown: categoryRows.map((row: any) => ({
        category: row.category,
        type: row.type,
        amount: Number(row._sum.amount ?? 0),
      })),
      recentTransactions,
      monthlyTrends: Array.from(monthlyMap.entries()).map(([month, values]) => ({
        month,
        ...values,
        net: values.income - values.expense,
      })),
    };
  }

  private buildSqlFilters(where: Record<string, unknown>) {
    const clauses: string[] = [];
    const params: Array<string | Date> = [];

    clauses.push('"deletedAt" IS NULL');

    if (where.category && typeof where.category === 'string') {
      clauses.push('category = ?');
      params.push(where.category);
    }

    if (where.type) {
      clauses.push('type = ?');
      params.push(String(where.type));
    }

    const dateFilter = where.date as { gte?: Date; lte?: Date } | undefined;

    if (dateFilter?.gte instanceof Date) {
      clauses.push('date >= ?');
      params.push(dateFilter.gte.toISOString());
    }

    if (dateFilter?.lte instanceof Date) {
      clauses.push('date <= ?');
      params.push(dateFilter.lte.toISOString());
    }

    return {
      clause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  private async ensureRecordExists(id: string) {
    const record = await this.prisma.financialRecord.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!record) {
      throw new NotFoundException('Financial record not found.');
    }

    return record;
  }

  private async ensureActiveRecordExists(id: string) {
    const record = await this.ensureRecordExists(id);

    if (record.deletedAt) {
      throw new NotFoundException('Financial record not found.');
    }

    return record;
  }
}
