import { PartialType } from '@nestjs/swagger';
import { CreateChallengeDto } from './create-challenge.dto.js';

/** `PATCH /challenges/:id` body — every create field, all optional. */
export class UpdateChallengeDto extends PartialType(CreateChallengeDto) {}
