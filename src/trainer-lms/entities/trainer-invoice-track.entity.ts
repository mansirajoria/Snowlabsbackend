import { InvoiceQueryStatus } from '@utils/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainerInvoice } from './trainer-invoice.entity';

@Entity('trainer-invoice-track')
export class TrainerInvoiceTrack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: string;

  @Column({
    type: 'enum',
    enum: InvoiceQueryStatus,
    default: InvoiceQueryStatus.NEW,
  })
  status: InvoiceQueryStatus;

  @ManyToOne(
    () => TrainerInvoice,
    (trainerInvoice) => trainerInvoice.trainerInvoiceTrack,
  )
  trainerInvoice: TrainerInvoice;
}
