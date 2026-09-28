import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offers } from './entities/offers.entity';
import { LessThan, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { OfferDto } from './dto/create-offer.dto';
import * as moment from 'moment';
import { FindDto } from '@skills/dto/find.dto';
import { FindOfferDto } from './dto/fins-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import HttpException from '@utils/exceptions/HttpException';
import { OfferRedeemed } from './entities/offer-redeemed.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Referral } from 'referral/entities/referral.entity';
import { ReferralCouponStatus, RewardCouponStatus } from '@utils/enum';
import { CredentialEntity } from 'credential/entities/credential.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offers) private offersRepo: Repository<Offers>,
    @InjectRepository(OfferRedeemed)
    private offersRedmeedRepo: Repository<OfferRedeemed>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(CredentialEntity)
    private readonly credentialRepo: Repository<CredentialEntity>,
  ) {}

  async createOffers(payload: OfferDto): Promise<Offers> {
    const exists = await this.offersRepo.findOne({
      where: [{ name: payload.name }, { couponCode: payload.couponCode }],
    });
    if (exists)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Offer already exists');
    const newOffer = new Offers();
    newOffer.name = payload.name;
    newOffer.details = payload.details;
    newOffer.discountINR = payload.discountInINR;
    newOffer.discountUSD = payload.discountInUSD;
    newOffer.discountPercentile = payload.discountPercentile;
    newOffer.couponCode = payload.couponCode;
    newOffer.validFrom = moment(payload.validFrom, 'YYYY-MM-DD')
      .startOf('day')
      .toDate();
    newOffer.validTill = moment(payload.validTill, 'YYYY-MM-DD')
      .endOf('day')
      .toDate();
    return this.offersRepo.save(newOffer);
  }

  async findOneOffer(id: string) {
    const offer = await this.offersRepo.findOne({ where: { id } });
    return offer;
  }

  async getOffers(
    payload: FindOfferDto,
  ): Promise<{ offers: Offers[]; totalOffers: number; totalRedeemed: number }> {
    const { page = 1, limit = 10 } = payload;
    const [offers, totalOffers] = await this.offersRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdDate: 'DESC' },
    });
    const redeemedCount = await this.offersRedmeedRepo.count();
    return { offers, totalOffers, totalRedeemed: redeemedCount };
  }

  async updateOffer(id: string, payload: UpdateOfferDto): Promise<Offers> {
    const offerDetails = await this.offersRepo.findOne({ where: { id } });
    if (!offerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'offer not found');
    const {
      name,
      couponCode,
      details,
      discountINR,
      discountUSD,
      isPublish,
      discountPercentile,
      validFrom,
      validTill,
      isActive,
    } = payload;
    if (isPublish) {
      const checkPublish = await this.offersRepo.findOne({
        where: { isPublish: true },
      });
      if (checkPublish)
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'Only one offer can be published at a time',
        );
      if (offerDetails.isActive === false)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Offer is not active');
    }

    offerDetails.isPublish = isPublish;

    if (isActive === false) {
      offerDetails.isPublish = false;
      offerDetails.isActive = false;
    }
    offerDetails.isActive = isActive;
    offerDetails.name = name;
    offerDetails.couponCode = couponCode;
    offerDetails.discountINR = discountINR;
    offerDetails.discountUSD = discountUSD;
    offerDetails.discountPercentile = discountPercentile;
    offerDetails.details = details;
    if (validFrom)
      offerDetails.validFrom = moment(validFrom, 'YYYY-MM-DD')
        .startOf('day')
        .toDate();
    if (validTill)
      offerDetails.validTill = moment(validTill, 'YYYY-MM-DD')
        .endOf('day')
        .toDate();
    return await this.offersRepo.save(offerDetails);
  }

  async getredmeedList(
    id: string,
    payload: FindOfferDto,
  ): Promise<{ redeemedOffer: OfferRedeemed[]; total: number }> {
    const { page = 1, limit = 10 } = payload;
    const offerDetails = await this.offersRepo.findOne({ where: { id } });
    if (!offerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'offer not found');
    const [redeemedOffer, total] = await this.offersRedmeedRepo.findAndCount({
      where: { offer: { id } },
      relations: ['course', 'student', 'student.auth'],
      take: limit,
      skip: (page - 1) * limit,
    });
    return { redeemedOffer, total };
  }

  async getOfferStrip() {
    const offers = await this.offersRepo.find({
      where: {
        isPublish: true,
        isActive: true,
        validTill: MoreThan(new Date()),
        validFrom: LessThan(new Date()),
      },
      order: { createdDate: 'desc' },
    });
    return offers;
  }

  async getOfferDetails(coupon: string, user: AuthEntity) {
    const dateNow = new Date();
    const offer = await this.offersRepo
      .createQueryBuilder('offer')
      .andWhere('offer.validTill > :date', { date: dateNow })
      .andWhere('offer.couponCode = :code', { code: coupon })
      .andWhere(`"isActive" = true`)
      .getOne();

    if (offer) return { promo: offer, isOffer: true };

    const referral = await this.referralRepo.findOne({
      where: {
        couponCode: coupon,
        emailId: user.email,
        validTill: MoreThan(new Date()),
        referralCouponStatus: ReferralCouponStatus.INACTIVE,
      },
    });

    if (referral) {
      const conversionRateUSDtoINR = await this.credentialRepo.findOne({
        where: { type: 'USD' },
      });
      referral.discountValueInINR = Math.round(
        referral.discountValueInUSD * conversionRateUSDtoINR.value,
      );
      await this.referralRepo.save(referral);
      return { promo: referral, isOffer: false };
    }
    const reward = await this.referralRepo.findOne({
      where: {
        couponCode: coupon,
        referredBy: { email: user.email },
        validTill: MoreThanOrEqual(new Date()),
        referralCouponStatus: ReferralCouponStatus.ACTIVE,
        rewardCouponStatus: RewardCouponStatus.TOBEREDEEMED,
      },
    });
    if (reward) return { promo: reward, isOffer: false };
    return 'No valid coupon codes found';
  }
}
