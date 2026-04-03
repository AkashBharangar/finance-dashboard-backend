import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RecordType } from 'src/common/enums/record-type.enum';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 'Operations',
    description: 'Optional category filter for dashboard analytics',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({
    enum: RecordType,
    example: RecordType.EXPENSE,
    description: 'Optional record type filter',
  })
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Optional ISO start date filter',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description: 'Optional ISO end date filter',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
