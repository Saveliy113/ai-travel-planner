import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class TravelPlanInterestDto {
  @IsString({ message: 'each interest.label must be a string' })
  @IsNotEmpty({ message: 'each interest.label is required' })
  label!: string;

  @IsString({ message: 'each interest.type must be a string' })
  @IsNotEmpty({ message: 'each interest.type is required' })
  type!: string;

  @IsString({ message: 'each interest.google_places_query must be a string' })
  @IsNotEmpty({ message: 'each interest.google_places_query is required' })
  google_places_query!: string;

  @IsString({ message: 'each interest.description must be a string' })
  @IsNotEmpty({ message: 'each interest.description is required' })
  description!: string;
}

class TravelPlanGenerateDto {
  @IsString({ message: 'destination must be a string' })
  @IsNotEmpty({ message: 'destination is required' })
  destination!: string;

  @IsString({ message: 'startDate must be a string' })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate!: string;

  @IsString({ message: 'endDate must be a string' })
  @IsNotEmpty({ message: 'endDate is required' })
  endDate!: string;

  @IsString({ message: 'budget must be a string' })
  @IsNotEmpty({ message: 'budget is required' })
  budget!: string;

  @IsArray({ message: 'interests must be an array' })
  @ArrayMinSize(1, { message: 'interests must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => TravelPlanInterestDto)
  interests!: TravelPlanInterestDto[];

  @IsOptional()
  @IsString({ message: 'additionalPreferences must be a string when present' })
  additionalPreferences?: string;
}

export { TravelPlanGenerateDto };
