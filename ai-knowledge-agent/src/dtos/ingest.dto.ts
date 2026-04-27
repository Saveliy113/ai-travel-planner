import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export enum IngestSort {
  LATEST = 'LATEST',
  EARLIEST = 'EARLIEST',
  RELEVANCE = 'RELEVANCE',
}

class IngestStartBodyDto {
  @IsString()
  @Matches(/^[A-Z0-9.\-]{1,10}$/, {
    message: 'ticker must be 1-10 uppercase letters, digits, dots or dashes',
  })
  ticker!: string;

  @IsString()
  @Matches(/^\d{8}$/, { message: 'timeFrom must be a string in YYYYMMDD format' })
  timeFrom!: string;

  @IsOptional()
  @IsEnum(IngestSort, { message: 'sort must be one of: LATEST, EARLIEST, RELEVANCE' })
  sort?: IngestSort = IngestSort.LATEST;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50;
}

export { IngestStartBodyDto };
