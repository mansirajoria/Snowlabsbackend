import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import ResponseHandler from '@utils/response.handler';
import { OfferDto } from './dto/create-offer.dto';
import { OffersService } from './offers.service';
import { FindOfferDto } from './dto/fins-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Request } from '@security/client/request';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';

@Controller('offers')
@ApiTags('Offers-Controller')
@UseInterceptors(TransformInterceptor)
export class OffersController extends ResponseHandler {
  constructor(private readonly offersService: OffersService) {
    super();
  }

  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.REFERRAL_OFFERS)
  @CheckAccess(AccessType.WRITE)
  @Post('/add')
  async createOffer(@Body() paylod: OfferDto) {
    try {
      const offer = await this.offersService.createOffers(paylod);
      return this.sendSuccessResponse(offer, 'Created successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  async getOffers(@Query() payload: FindOfferDto) {
    try {
      const offers = await this.offersService.getOffers(payload);
      return this.sendSuccessResponse(offers, 'Offers fetch successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/getStrip')
  async getStrip() {
    try {
      const result = await this.offersService.getOfferStrip();
      return this.sendSuccessResponse(result, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get the details of an offer with offer ID' })
  async getOneOffer(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const offer = await this.offersService.findOneOffer(id);
      return this.sendSuccessResponse(offer, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.REFERRAL_OFFERS)
  @CheckAccess(AccessType.WRITE)
  @Patch(':id')
  @ApiOperation({ summary: 'Update the offer with offer ID' })
  async updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateOfferDto,
  ) {
    try {
      const offer = await this.offersService.updateOffer(id, payload);
      return this.sendSuccessResponse(offer, 'Offer updated successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.REFERRAL_OFFERS)
  @CheckAccess(AccessType.READ)
  @Get('/redeemed/:offerId')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  async getredmeedList(
    @Param('offerId', ParseUUIDPipe) id: string,
    @Query() payload: FindOfferDto,
  ) {
    try {
      const redeemedOffer = await this.offersService.getredmeedList(
        id,
        payload,
      );
      return this.sendSuccessResponse(
        redeemedOffer,
        'Redmeeded update successfully',
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/offerDetails/:coupon')
  async getOfferDetails(@Req() req: Request, @Param('coupon') coupon: string) {
    try {
      const result = await this.offersService.getOfferDetails(coupon, req.user);
      return this.sendSuccessResponse(result, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }
}
