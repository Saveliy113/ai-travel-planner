import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class TravelSetupClarificationOptionDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

class TravelSetupInterestCategoryDto {
  @IsString()
  label!: string;

  @IsString()
  searchQuery!: string;

  @IsString()
  description!: string;
}

class TravelSetupGenerateDto {
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
  @Type(() => TravelSetupClarificationOptionDto)
  clarificationOptions?: TravelSetupClarificationOptionDto[];

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
  @Type(() => TravelSetupInterestCategoryDto)
  interestCategories?: TravelSetupInterestCategoryDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedInterestLabels?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelSetupInterestCategoryDto)
  selectedInterests?: TravelSetupInterestCategoryDto[];

  @IsOptional()
  @IsString()
  additionalPreferences?: string;
}

export { TravelSetupGenerateDto };
