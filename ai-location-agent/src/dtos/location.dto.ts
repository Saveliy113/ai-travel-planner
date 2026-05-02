import { Type } from 'class-transformer';
import { IsArray, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

class LocationBodyDto {
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
  @IsNotEmpty({ message: 'categories is required' })
  categories!: string[];

  @IsNumber({}, { message: 'poiCount must be a number' })
  @IsNotEmpty({ message: 'poiCount is required' })
  poiCount!: number;
}

export { LocationBodyDto };
