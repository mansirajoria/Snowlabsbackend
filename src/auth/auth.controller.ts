import { Response } from 'express';
import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  Res,
  Query,
  Param,
  ParseUUIDPipe,
  Patch,
  Delete,
  Req,
  Headers,
} from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { ResponseHandler } from '@utils/response.handler';
import { ResponseDTO } from '@utils/response.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import {
  CreateAuthDto,
  UpdateSubAdminDto,
  SearchQueryDto,
  LoginCredsDto,
  LoginDto,
  ForgotPasswordDto,
  RegisterDto,
  SlugFilterDto,
} from '@auth/dto/common.dto';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { Request } from '@security/client/request';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { filter } from 'lodash';
import { AuthEntity } from './entities/auth.entity';
import { CheckUserDTO } from './dto/check-user.dto';

@ApiTags('Auth-Controller')
@UseInterceptors(TransformInterceptor)
@Controller({ path: 'auth', version: '1' })
export class AuthController extends ResponseHandler {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Get('/health-check')
  async healthCheck() {
    return this.sendSuccessResponse({}, 'Health Check Route', 200);
  }

  /*
   * Sub-Admin CRUD
   */

  @Post('subadmin')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiBearerAuth('bearer')
  async creatSubAdmin(@Body() payload: CreateAuthDto): Promise<ResponseDTO> {
    try {
      const subadmin = await this.authService.creatSubAdmin(payload);
      return this.sendSuccessResponse(subadmin, 'Created the Sub-Admin', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('subadmin')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.READ)
  @ApiBearerAuth()
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: true, type: String })
  @ApiQuery({ name: 'pageNo', required: true, type: String })
  async findAllSubAdmin(
    @Query() payload: SearchQueryDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.findAllSubAdmin(payload);
      if (resp.data.length == 0)
        return this.sendSuccessResponse(resp, 'Sub-Admin Not found', 200);
      return this.sendSuccessResponse(resp, 'Sub-Admin fetched successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('subadmin/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.READ)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  async getSubadmin(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const resp = await this.authService.findOneSubadmin(id);
      return this.sendSuccessResponse(resp, 'Sub-Admin fetched succesfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('subadmin/change-status/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  async changeSubAdminStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.changeStatus(id);

      if (resp.isActive == false)
        return this.sendSuccessResponse(
          {},
          'Sub-Admin deactivated succesfully',
        );
      if (resp.isActive == true)
        return this.sendSuccessResponse({}, 'Sub-Admin Activated succesfully');
      return this.sendSuccessResponse({}, 'wait');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('subadmin/:id')
  @Roles(RoleType.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  async updateSubAdmin(
    @Param('id') id: string,
    @Body() payload: UpdateSubAdminDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.updateSubAdmin(id, payload);
      return this.sendSuccessResponse(resp, 'Updated the Sub-Admin', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Delete('subadmin/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  async deleteSubAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.softDeleteSubAdmin(id);
      return this.sendSuccessResponse(resp, 'Sub-Admin deleted succesfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * Check if user exists
   */

  @Post('check-user-signup')
  async checkUser(@Body() payload: CheckUserDTO) {
    try {
      const resp = await this.authService.checkUser(payload);
      return this.sendSuccessResponse(resp, 'No user exists', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('send-account-creds')
  // @Roles(RoleType.ADMIN)
  // @UseGuards(AuthGuard, RolesGuard)
  async sendLoginCredentials(
    @Body() payload: LoginCredsDto,
  ): Promise<ResponseDTO> {
    try {
      await this.authService.sendLoginCredentials(payload);
      return this.sendSuccessResponse({}, 'Login creds sent successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * **************  WEBSITE  ****************
   * Student : Website user treated as Student
   * We dont need any kind of Roleguard Here
   */

  @Post('/signup')
  @ApiOperation({ summary: 'Register Website User as Student' })
  async signup(
    @Body() req: RegisterDto,
    @Headers('timezone') timezone: string,
  ): Promise<ResponseDTO> {
    try {
      const user = await this.authService.signup(req, timezone);
      return this.sendSuccessResponse(user, 'Created the Student');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post(`/login`)
  @ApiOperation({ summary: 'User authorization retrieving token' })
  async login(@Body() req: LoginDto): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.login(req);
      return this.sendSuccessResponse(resp, 'Login successfull', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/info')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'User authorization retrieving token' })
  async authInfo(@Req() req: Request) {
    try {
      const user = await this.authService.authInfo(req.user.id);
      return this.sendSuccessResponse(user, 'Auth Information');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post(`/logout`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request): Promise<ResponseDTO> {
    try {
      await this.authService.logout(req.user.id);
      return this.sendSuccessResponse({}, 'LogOut successfull', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('/forgot-pasword')
  @ApiOperation({ summary: 'To send User new account password' })
  async forgotPassword(
    @Body() payload: ForgotPasswordDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.forgotPassword(payload.email);
      return this.sendSuccessResponse({}, resp);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * *******************  Admin Panel  *******************
   */

  /*
   * Admin & Sub-Admin User Login
   */

  @Post('/admin')
  @ApiOperation({ summary: 'Admin & SubAdmin authorization retrieving token' })
  async adminLogin(@Body() req: LoginDto): Promise<ResponseDTO> {
    try {
      const response = await this.authService.adminLogin(req);
      return this.sendSuccessResponse(response, 'Admin Login successfull', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/')
  @Roles(RoleType.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List all the Admin' })
  async findAllAdmin(): Promise<ResponseDTO> {
    try {
      const admins = await this.authService.findAllAdmin();
      return this.sendSuccessResponse(admins, 'Admin Users');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('/admin/forgot-pasword')
  @ApiOperation({ summary: 'To send Admin or Subadmin new account password' })
  async forgotPasswordAdmin(
    @Body() payload: ForgotPasswordDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.forgotPasswordAdmin(payload.email);
      return this.sendSuccessResponse({}, resp, 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   *   Forgot Password Flow
   

  @Post('forgot-pasword-init')
  async forgotPasswordInit(email: string): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.forgotPasswordInit(email);
      return this.sendSuccessResponse({}, resp, 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('forgot-pasword-success')
  async forgotPasswordSuccess(payload: ResetPasswordDto): Promise<ResponseDTO> {
    try {
      const resp = await this.authService.forgotPasswordSuccess(payload);
      return this.sendSuccessResponse({}, resp, 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  */

  /*
   * OutLook Login flow
   */

  @Get('/callBack')
  async teamsCallBack(@Query() payload: any, @Res() res: Response) {
    try {
      const token = await this.authService.teamCallBack(payload?.code);
      return res.redirect(
        `${process.env.ADMIN_DOMAIN}/dashboard?token=${token}`,
      );
    } catch (error) {
      return res.redirect(process.env.ADMIN_DOMAIN);
    }
  }

  @Get('/check-slugName')
  @ApiQuery({ name: 'slugName', type: String, required: true })
  @ApiQuery({ name: 'filter', type: String, required: true })
  async slugChecker(@Query() payload: SlugFilterDto) {
    try {
      const response = await this.authService.slugChecker(payload);
      return this.sendSuccessResponse(response, 'Slug fetched', 200);
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/slugNames')
  async slugNames() {
    try {
      const response = await this.authService.slugNames();
      return this.sendSuccessResponse(response, 'Slug fetched', 200);
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
  /*
   * Linkdin Login flow
   *

  @Get('/linkdin')
  @UseGuards(LinkedInAuthGuard)
  async linkedInLogin() {}

  @Get('/linkdin/callBack')
  @UseGuards(LinkedInAuthGuard)
  async linkedInCallback(@Request() req) {
    try {
      const response = await this.authService.linkedInAuthRegister(req.user);
      return this.sendSuccessResponse(response, 'Logged in successfully');
    } catch (err) {
      return this.sendFailedResponse(err, 'Server error');
    }
  }

  */
}
