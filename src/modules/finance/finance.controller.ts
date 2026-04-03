import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RecordType } from 'src/common/enums/record-type.enum';
import { Role } from 'src/common/enums/role.enum';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { FinancialRecordQueryDto } from './dto/financial-record-query.dto';
import { UpdateFinancialRecordDto } from './dto/update-financial-record.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles(Role.ADMIN)
  @Post('records')
  createRecord(@Body() createFinancialRecordDto: CreateFinancialRecordDto) {
    return this.financeService.createRecord(createFinancialRecordDto);
  }

  @Roles(Role.ANALYST, Role.ADMIN)
  @Get('records')
  @ApiQuery({ name: 'category', required: false, type: String, example: 'Operations' })
  @ApiQuery({ name: 'type', required: false, enum: RecordType, example: RecordType.EXPENSE })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2026-04-30' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'consulting' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  getRecords(@Query() query: FinancialRecordQueryDto) {
    return this.financeService.getRecords(query);
  }

  @Roles(Role.ADMIN)
  @Patch('records/:id')
  updateRecord(
    @Param('id') id: string,
    @Body() updateFinancialRecordDto: UpdateFinancialRecordDto,
  ) {
    return this.financeService.updateRecord(id, updateFinancialRecordDto);
  }

  @Roles(Role.ADMIN)
  @Delete('records/:id')
  @ApiOperation({ summary: 'Soft delete a financial record' })
  deleteRecord(@Param('id') id: string) {
    return this.financeService.deleteRecord(id);
  }

  @Roles(Role.ADMIN)
  @Patch('records/:id/restore')
  @ApiOperation({ summary: 'Restore a previously soft-deleted financial record' })
  restoreRecord(@Param('id') id: string) {
    return this.financeService.restoreRecord(id);
  }
}
