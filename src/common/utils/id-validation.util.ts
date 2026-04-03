import { BadRequestException } from '@nestjs/common';

const CUID_PATTERN = /^c[a-z0-9]{24}$/;

export function validateEntityId(id: string, label = 'resource') {
  if (!CUID_PATTERN.test(id)) {
    throw new BadRequestException(`Invalid ${label} ID.`);
  }
}
