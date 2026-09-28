import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Webinar } from './webinar.entity';
import { AuthEntity } from '@auth/entities/auth.entity';

@Entity('webinar-enrollment')
export class WebinarEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Webinar)
  webinar: Webinar;

  @ManyToOne(() => AuthEntity, { onDelete: 'CASCADE' })
  auth: AuthEntity;

  @CreateDateColumn()
  registeredAt: string;
}
