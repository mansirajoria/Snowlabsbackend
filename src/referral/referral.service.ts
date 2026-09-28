import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { And, Between, LessThan, MoreThan, Repository } from 'typeorm';
import { generateReferralSequence } from '@utils/sequence-generator/sequence.service';
import { AuthEntity } from '@auth/entities/auth.entity';
import * as moment from 'moment';
import HttpException from '@utils/exceptions/HttpException';
import { QueryReferralDTO } from './dto/query-referral.dto';
import { ReferralCouponStatus, RewardCouponStatus } from '@utils/enum';
import { ApiQuery } from '@nestjs/swagger';
import { MailService } from '@mail/mail.service';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(AuthEntity)
    private readonly authRepo: Repository<AuthEntity>,
    private readonly mailService: MailService,
  ) {}

  async create(createReferralDto: CreateReferralDto) {
    const { emailId, fullName, courseName, countryCode, phoneNumber, authId } =
      createReferralDto;

    const userExists = await this.authRepo.findOne({
      where: { email: emailId },
    });
    if (userExists)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'This user already has an existing account',
      );
    const referralExists = await this.referralRepo.findOne({
      where: { emailId: emailId, validTill: MoreThan(new Date()) },
    });
    if (referralExists)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'This user has already been referred once',
      );
    const referral = new Referral();
    referral.referedToName = fullName;
    referral.couponCode = generateReferralSequence();
    referral.validTill = new Date(moment().add(1, 'M').format());
    referral.contactNo = phoneNumber;
    referral.countryCode = countryCode;

    if (authId) {
      const user = await this.authRepo.findOne({ where: { id: authId } });
      if (!user) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
      referral.referredBy = user;
      if (user.email === emailId)
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'Email should not be same as user email',
        );
      referral.emailId = emailId;
    }
    const referralMailBody = `
<p>Hi ${referral.referedToName},</p>
<p>You've been referred to SnowLabs by ${referral.referredBy.name}</p>
<p>Use referral code: ${referral.couponCode} during purchase to avail discount on your purchase</p>`;
    this.mailService.sendViaSendGrid({
      to: referral.emailId,
      subject: 'Referral',
      text: referralMailBody,
    });

    return await this.referralRepo.save(referral);
  }

  async findAll(user: AuthEntity, queryDto: QueryReferralDTO) {
    const { page = 1, limit = 10, date } = queryDto;
    if (user) {
      const [referrals, totalCount] = await this.referralRepo
        .createQueryBuilder('referral')
        .leftJoin('referral.referredBy', 'user')
        .where('user.id = :userId', { userId: user.id })
        .orderBy('referral.createdDate')
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();
      return { data: referrals, totalCount };
    }
    const startDate = date ? moment(date).startOf('month').toDate() : null;
    const endDate = date ? moment(date).endOf('month').toDate() : null;
    const referrals = this.referralRepo.find({
      take: limit,
      skip: (page - 1) * limit,
      relations: { referredBy: true },
      where: { createdDate: date ? Between(startDate, endDate) : null },
    });
    const total = this.referralRepo.count();
    const converted = this.referralRepo.count({
      where: { referralCouponStatus: ReferralCouponStatus.ACTIVE },
    });
    const [data, totalCount, convertedCount] = await Promise.all([
      referrals,
      total,
      converted,
    ]);
    return { data, totalCount, convertedCount };
  }

  findOne(id: number) {
    return `This action returns a #${id} referral`;
  }

  update(id: number, updateReferralDto: UpdateReferralDto) {
    return `This action updates a #${id} referral`;
  }

  remove(id: number) {
    return `This action removes a #${id} referral`;
  }
}
