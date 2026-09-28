import { PartialType } from '@nestjs/swagger';
import { Faq } from './create-faq.dto';

export class UpdateFaqDTO extends PartialType(Faq) {}
