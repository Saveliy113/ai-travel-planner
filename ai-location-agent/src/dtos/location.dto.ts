import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LocationCategoryItemDto {
  @IsOptional()
  @IsString({ message: 'category display name must be a string' })
  name?: string;

  @IsString({ message: 'category searchQuery must be a string' })
  @IsNotEmpty({ message: 'category searchQuery is required' })
  searchQuery!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'category count must be a number' })
  @Min(1, { message: 'category count must be at least 1' })
  count!: number;
}

class LocationBodyDto {
  @IsArray({ message: 'categories must be an array' })
  @ValidateNested({ each: true, message: 'each category must be a valid object: { name: string, count: number }' })
  @Type(() => LocationCategoryItemDto)
  @IsNotEmpty({ message: 'categories is required' })
  categories!: LocationCategoryItemDto[];
}

class LocationInterestsBodyDto {
  @IsString({ message: 'destination must be a string' })
  @IsNotEmpty({ message: 'destination is required' })
  destination!: string;
}

export { LocationBodyDto, LocationCategoryItemDto, LocationInterestsBodyDto };
