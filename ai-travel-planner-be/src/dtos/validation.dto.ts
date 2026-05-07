import { IsNotEmpty, IsString } from 'class-validator';

class TravelPlannerInputDto {
  @IsString({ message: 'destination must be a string' })
  @IsNotEmpty({ message: 'destination is required' })
  destination!: string;
}

export { TravelPlannerInputDto };
