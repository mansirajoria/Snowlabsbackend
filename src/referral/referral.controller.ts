import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import ResponseHandler from '@utils/response.handler';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { QueryReferralDTO } from './dto/query-referral.dto';
import { AuthGuard } from '@security/guards/auth.guard';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { RolesGuard } from '@security/guards/roles.guard';

@ApiTags('Referral-Controller')
@UseInterceptors(TransformInterceptor)
@Controller('referral')
export class ReferralController extends ResponseHandler {
  constructor(private readonly referralService: ReferralService) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @CheckPermissions(PermissionType.REFERRAL_OFFERS)
  @CheckAccess(AccessType.READ)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'date', required: false, type: Date })
  @Get()
  async getAllReferrals(@Query() query: QueryReferralDTO) {
    try {
      const result = await this.referralService.findAll(null, query);
      return this.sendSuccessResponse(result, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post()
  async create(@Body() createReferralDto: CreateReferralDto) {
    try {
      const result = await this.referralService.create(createReferralDto);
      return this.sendSuccessResponse(result, 'Created successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.referralService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReferralDto: UpdateReferralDto,
  ) {
    return this.referralService.update(+id, updateReferralDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referralService.remove(+id);
  }
}
