import { AuthEntity } from '@auth/entities/auth.entity';
import { BaseEntity } from '@utils/base.entity';
import { ReferralCouponStatus, RewardCouponStatus } from '@utils/enum';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('referral')
export class Referral extends BaseEntity {
  @Column()
  referedToName: string;

  @Column()
  contactNo: string;

  @Column()
  countryCode: string;

  @Column()
  emailId: string;

  @ManyToOne(() => AuthEntity)
  referredBy: AuthEntity;

  @Column({ nullable: true })
  validTill: Date;

  @Column({
    enum: ReferralCouponStatus,
    default: ReferralCouponStatus.INACTIVE,
  })
  referralCouponStatus: ReferralCouponStatus;

  @Column()
  couponCode: string;

  @Column({ default: 20 })
  discountValueInUSD: number;

  @Column({ default: 1665 })
  discountValueInINR: number;

  @Column({
    enum: RewardCouponStatus,
    default: RewardCouponStatus.TOBEREDEEMED,
  })
  rewardCouponStatus: RewardCouponStatus;
}
