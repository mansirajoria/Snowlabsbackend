import { AuthEntity } from '@auth/entities/auth.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { BaseEntity } from '@utils/base.entity';
import { GatewayEnum, PaymentStatusEnum } from '@utils/enum';
import { Offers } from 'offers/entities/offers.entity';
import { Referral } from 'referral/entities/referral.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('payment')
export class Payment extends BaseEntity {
  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  gatewayOrderId: string;

  @Column({ nullable: true })
  paymentMode: string;

  @Column({
    nullable: true,
    default: PaymentStatusEnum.CREATED,
  })
  paymentStatus: string;

  @Column('float', { nullable: true })
  amount: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column('float', { nullable: true })
  tax: number;

  @Column('float', { nullable: true })
  gatewayCharges: number;

  @Column({ nullable: true })
  promoCode: string;

  @Column('float', { nullable: true })
  total: number;

  @Column({ nullable: true })
  offlinePayment: boolean;

  @ManyToOne(() => AuthEntity, (authEntity) => authEntity.id)
  auth: AuthEntity;

  @ManyToOne(() => Course, (courseEntity) => courseEntity.payment)
  course: Course;

  @ManyToOne(() => BatchEntity, (batchEntity) => batchEntity.payment)
  batch: BatchEntity;

  @Column({ enum: GatewayEnum, nullable: true })
  gatewayUsed: GatewayEnum;

  @Column({ nullable: true })
  promo: string;

  @ManyToOne(() => Referral)
  referral: Referral;

  @ManyToOne(() => Offers)
  offer: Offers;
}
