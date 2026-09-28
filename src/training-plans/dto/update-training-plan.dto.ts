import { PartialType } from '@nestjs/swagger';
import { CreateTrainingPlanDto } from './create-training-plan.dto';

export class UpdateTrainingPlanDto extends PartialType(CreateTrainingPlanDto) {}
