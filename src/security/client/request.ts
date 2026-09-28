import { AuthEntity } from '@auth/entities/auth.entity';
import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user?: AuthEntity;
}
