import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offers } from './entities/offers.entity';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferRedeemed } from './entities/offer-redeemed.entity';
import { Referral } from 'referral/entities/referral.entity';
import { CredentialEntity } from 'credential/entities/credential.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offers,
      OfferRedeemed,
      Referral,
      CredentialEntity,
    ]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
