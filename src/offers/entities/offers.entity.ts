import { BaseEntity } from '@utils/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('offers')
export class Offers extends BaseEntity {
  @Column()
  name: string;

  @Column()
  details: string;

  @Column({ nullable: true })
  discountINR: number;

  @Column({ nullable: true })
  discountUSD: number;

  @Column({ nullable: true, default: 0 })
  discountPercentile: number;

  @Column()
  validFrom: Date;

  @Column({ nullable: true })
  validTill: Date;

  @Column({ default: false })
  isPublish: boolean;

  @Column({ default: false, nullable: true })
  isActive: boolean;

  @Column({ unique: true })
  couponCode: string;
}
