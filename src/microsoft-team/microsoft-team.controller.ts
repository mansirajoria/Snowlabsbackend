import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MicrosoftTeamService } from './microsoft-team.service';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import ResponseHandler from '@utils/response.handler';
import { ResponseDTO } from '@utils/response.dto';
import { CreateMeetDto } from './dto/meet.dto';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { Request } from '@security/client/request';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MicrosoftSearchDto } from './dto/query-ms.dto';
import { CreateTeamsWebinarDto } from './dto/webinar.dto';
import { CelenderDto } from './dto/celender.dto';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { CredentialService } from 'credential/credential.service';

@ApiTags('Team-Controller')
@UseInterceptors(TransformInterceptor)
@Controller({ path: 'team', version: '1' })
export class MicrosoftTeamController extends ResponseHandler {
  constructor(
    private readonly microsoftTeamService: MicrosoftTeamService,
    private readonly credentialService: CredentialService,
  ) {
    super();
  }

  @Get('/auth-url')
  async authUrl(): Promise<ResponseDTO> {
    try {
      const url = await this.microsoftTeamService.authUrl();
      return this.sendSuccessResponse({ url }, 'Authenticate successfull', 200);
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Post('/create-link')
  @Roles(RoleType.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  async createLink(
    @Req() req: Request,
    @Body() createMeetdto: CreateMeetDto,
  ): Promise<ResponseDTO> {
    try {
      const meetLink = await this.microsoftTeamService.createMeeting(
        createMeetdto,
        req.user.outLookToken,
      );
      return this.sendSuccessResponse(
        { meetLink },
        'Meeting create successfull',
        200,
      );
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Post('/webinar')
  @Roles(RoleType.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  async createWebinar(
    @Req() req: Request,
    @Body() createMeetdto: CreateTeamsWebinarDto,
  ): Promise<ResponseDTO> {
    try {
      const meetLink = await this.microsoftTeamService.createWebinar(
        createMeetdto,
        req.user.outLookToken,
      );
      return this.sendSuccessResponse(
        { meetLink },
        'Meeting create successfull',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Post()
  async getToken(): Promise<any> {
    try {
      const tokenResponse = await this.microsoftTeamService.getToken();
      if (tokenResponse == undefined) {
        return this.sendFailedResponse('Authentication failed', '401');
      }
      return this.sendSuccessResponse(
        { tokenResponse },
        'Authenticate successfull',
        200,
      );
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Get('sites')
  @ApiQuery({ name: 'search', required: false, type: String })
  async searchSites(
    @Req() req: Request,
    @Query() searchDto: MicrosoftSearchDto,
  ): Promise<any> {
    const accessToken = req.headers.authorization;
    const siteResponses = await this.microsoftTeamService.searchSites(
      searchDto,
      accessToken,
    );
    return this.sendSuccessResponse(
      { siteResponses },
      'site data fetch successfully',
      200,
    );
  }

  @Get('sites/drive')
  async getDriveRoot(
    @Query('siteId') siteId: string,
    @Query('file') file: string,
    @Req() req: Request,
  ): Promise<any> {
    const accessToken = req.headers.authorization;
    const driveResponse = await this.microsoftTeamService.getDriveRoot(
      siteId,
      file,
      accessToken,
    );
    return this.sendSuccessResponse(
      { driveResponse },
      'file data fetch successfully',
      200,
    );
  }

  @Get('/recording-links')
  async teamsRecording() {
    try {
      const link = await this.microsoftTeamService.uploadRecordingToAWs();
      return this.sendSuccessResponse(
        { link },
        'Authenticate successfull',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Get('/calender')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.CALENDER)
  @CheckAccess(AccessType.READ)
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: 'YYYY-MM-DD',
  })
  async fetchCelender(
    @Req() req: Request,
    @Query() searchDto: CelenderDto,
  ): Promise<ResponseDTO> {
    try {
      const celenderData = await this.microsoftTeamService.fetchCelender(
        searchDto,
      );
      return this.sendSuccessResponse(
        { celenderData },
        'celender fetch successfull',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @ApiBearerAuth()
  @Post('/send-invitation')
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.READ)
  async sendInvitation(
    @Body() invitationDto: SendInvitationDto,
  ): Promise<ResponseDTO> {
    try {
      const outlookCreds = await this.credentialService.outlookCreds();
      await this.microsoftTeamService.sendInvitation(
        invitationDto,
        outlookCreds.outLookToken,
      );
      return this.sendSuccessResponse({}, 'send invitation successfull', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
