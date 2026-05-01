import { Type } from 'class-transformer';
import { IsArray, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

class LocationQueryDto {
  @IsString({ message: 'destination must be a string' })
  @IsNotEmpty({ message: 'destination is required' })
  destination!: string;

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

  @IsArray({ message: 'categories must be an array' })
  @IsString({ each: true, message: 'each category must be a string' })
  @IsOptional()
  implicitCategories?: string[];

  @IsString({ message: 'style must be a string' })
  @IsOptional()
  style?: string;

  @IsString({ message: 'budgetLevel must be a string' })
  @IsOptional()
  budgetLevel?: 'low' | 'mid' | 'high';
}

export { LocationQueryDto };
