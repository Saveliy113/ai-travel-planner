import { Type } from 'class-transformer';
import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LocationCategoryItemDto {
  @IsString({ message: 'category name must be a string' })
  @IsNotEmpty({ message: 'category name is required' })
  name!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'category count must be a number' })
  @Min(1, { message: 'category count must be at least 1' })
  count!: number;
}

class LocationBodyDto {
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
  @ValidateNested({ each: true, message: 'each category must be a valid object: { name: string, count: number }' })
  @Type(() => LocationCategoryItemDto)
  @IsNotEmpty({ message: 'categories is required' })
  categories!: LocationCategoryItemDto[];
}

export { LocationBodyDto, LocationCategoryItemDto };
