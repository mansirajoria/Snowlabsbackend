import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { TransformInterceptor } from "@utils/interceptors/response.interceptor";
import ResponseHandler from "@utils/response.handler";
import { FeedbackFormDto } from "./dto/feedback-form.dto";
import { FeedbackService } from "./feedback-service";
import { CheckAccess, CheckPermissions, Roles } from "@security/decorators/roles.decorator";
import { RolesGuard } from "@security/guards/roles.guard";
import { AccessType, PermissionType, RoleType } from "@utils/enum";
import { AuthGuard } from "@security/guards/auth.guard";
import { SearchFeedBackDto } from "./dto/search-form.dto";

@ApiTags('Feedback-Controller')
@UseInterceptors(TransformInterceptor)
@Controller('feedback')
export class FeedbackController extends ResponseHandler {
  constructor(
    private readonly feedbackService:FeedbackService
  ) {
    super();
  }
  
@Post("/")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
@CheckPermissions(PermissionType.COURSES)
@CheckAccess(AccessType.WRITE)
async createFeedbackForm (@Body() payload :FeedbackFormDto){
    try{
        await this.feedbackService.createFeedbackForm(payload)
        return this.sendSuccessResponse(
          {},
          'Feedback form created successfully !',
          201,
        );

    }catch(err)
    {
        return this.sendFailedResponse({}, err.message);
    }

  }

@Get("/")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
@CheckPermissions(PermissionType.COURSES)
@CheckAccess(AccessType.READ)
@ApiQuery({ name: 'formType', required: false, type: String })
async feedbackForm (@Query() payload :SearchFeedBackDto){
    try{
        const feedbackForm=await this.feedbackService.feedbackForm(payload)
        return this.sendSuccessResponse(
          feedbackForm,
          'Feedback form fetch successfully !',
          201,
        );

    }catch(err)
    {
        return this.sendFailedResponse({}, err.message);
    }

  }
}
