import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class TravelPlanClarificationOptionDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

class TravelPlanInterestCategoryDto {
  @IsString()
  label!: string;

  @IsString()
  searchQuery!: string;

  @IsString()
  description!: string;
}

class TravelPlanGenerateDto {
  @IsOptional()
  @IsNumber()
  step?: number;

  @IsString({ message: 'destination must be a string' })
  @IsNotEmpty({ message: 'destination is required' })
  destination!: string;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  firstStepPhase?: string;

  @IsOptional()
  @IsString()
  clarificationReason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelPlanClarificationOptionDto)
  clarificationOptions?: TravelPlanClarificationOptionDto[];

  @IsOptional()
  @IsString()
  selectedClarification?: string;

  @IsOptional()
  @IsString()
  selectedClarificationDescription?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelPlanInterestCategoryDto)
  interestCategories?: TravelPlanInterestCategoryDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedInterestLabels?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelPlanInterestCategoryDto)
  selectedInterests?: TravelPlanInterestCategoryDto[];

  @IsOptional()
  @IsString()
  additionalPreferences?: string;
}

export { TravelPlanGenerateDto };
