import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import { InvoiceQueryCategory } from '@utils/enum';
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TrainerInvoiceTrack } from './trainer-invoice-track.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Exclude } from 'class-transformer';

@Entity('trainer-invoice')
export class TrainerInvoice extends BaseEntity {
  @Column({ nullable: true })
  invoiceId: string;

  @Column({ type: 'enum', enum: InvoiceQueryCategory })
  invoiceCategory: InvoiceQueryCategory;

  @Column()
  invoiceAmount: number;

  @Column({ nullable: true })
  status: string; // show only for trainer lms

  @ManyToOne(() => Trainer, (trainer) => trainer.trainerInvoice)
  trainer: Trainer;

  @OneToMany(
    () => TrainerInvoiceTrack,
    (trainerInvoiceTrack) => trainerInvoiceTrack.trainerInvoice,
  )
  trainerInvoiceTrack: TrainerInvoiceTrack[];

  @ManyToOne(() => Webinar, (webinar) => webinar.invoice)
  webinar: Webinar;

  @ManyToOne(() => BatchEntity, (batchEntity) => batchEntity.invoice)
  batch: BatchEntity;

  @Column({ type: 'boolean', default: false })
  isOpened: boolean;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;
}
