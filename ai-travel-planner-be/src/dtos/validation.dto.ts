import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

class TravelPlannerInputDto {
  @IsString()
  @MinLength(1, { message: 'destination is required' })
  @MaxLength(4000, { message: 'destination is too long' })
  @IsNotEmpty({ message: 'destination is required' })
  destination!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsDateString({}, { message: 'startDate must be a valid ISO date' })
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsDateString({}, { message: 'endDate must be a valid ISO date' })
  endDate?: string;
}

export { TravelPlannerInputDto };
