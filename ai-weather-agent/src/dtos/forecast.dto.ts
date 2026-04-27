import { Type } from 'class-transformer';
import { IsDateString, IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

class ForecastQueryDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'lat must be a number' })
  @IsLatitude({ message: 'lat must be a valid latitude' })
  @IsNotEmpty({ message: 'lat is required' })
  lat!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'lon must be a number' })
  @IsLongitude({ message: 'lon must be a valid longitude' })
  @IsNotEmpty({ message: 'lon is required' })
  lon!: number;

  @IsDateString({}, { message: 'startDate must be a valid date' })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate!: string;

  @IsDateString({}, { message: 'endDate must be a valid date' })
  @IsNotEmpty({ message: 'endDate is required' })
  endDate!: string;
}

export { ForecastQueryDto };
