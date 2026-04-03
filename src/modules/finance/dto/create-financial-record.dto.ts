import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordType } from 'src/common/enums/record-type.enum';

export class CreateFinancialRecordDto {
  @ApiProperty({
    example: 1250.5,
    description: 'Transaction amount',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiProperty({
    enum: RecordType,
    example: RecordType.INCOME,
    description: 'Whether the record is income or expense',
  })
  @IsEnum(RecordType)
  type!: RecordType;

  @ApiProperty({
    example: 'Consulting',
    description: 'Business category for the record',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    example: '2026-04-01T00:00:00.000Z',
    description: 'ISO date for the transaction',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    example: 'April consulting payment',
    description: 'Optional notes for the transaction',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}
