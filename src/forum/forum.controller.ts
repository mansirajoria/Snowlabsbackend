import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreateForumDto } from './dto/create-forum.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { Request } from '@security/client/request';
import { AuthGuard } from '@security/guards/auth.guard';
import { ForumListDTO } from './dto/forum-list.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { EditCommentDTO } from './dto/ecit-comment.dto';

@Controller('forum')
@ApiTags('Forum-Controller')
export class ForumController extends ResponseHandler {
  constructor(private readonly forumService: ForumService) {
    super();
  }

  @Get('/dropdown/category')
  @ApiOperation({ summary: 'Returns the all the categories' })
  async getCategory() {
    try {
      const resp = await this.forumService.getCategory();
      return this.sendSuccessResponse(resp, 'Catgory to show ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/dropdown/all-batch')
  @ApiOperation({ summary: 'Returns the all batches array' })
  async getAllBatch() {
    try {
      const resp = await this.forumService.getAllBatch();
      return this.sendSuccessResponse(resp, 'All batches to show ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/dropdown/batch')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns the my batches array' })
  async getMyBatch(@Req() req: Request) {
    try {
      const resp = await this.forumService.getMyBatch(req.user.id);
      return this.sendSuccessResponse(resp, 'My batches to show ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns the newly created forum' })
  async create(@Body() createForumDto: CreateForumDto, @Req() req: Request) {
    try {
      const resp = await this.forumService.create(createForumDto, req.user.id);
      return this.sendSuccessResponse(resp, 'Created the Post');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'categoryName', required: false, type: 'string' })
  @ApiQuery({ name: 'batchId', required: false, type: 'string' })
  @ApiOperation({ summary: 'Returns the all forum information' })
  async findAll(@Query() payload: ForumListDTO) {
    try {
      const resp = await this.forumService.findAll(payload);
      return this.sendSuccessResponse(resp, 'Forums fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/my-question')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Returns the all forum information added by current User',
  })
  async findMyPost(@Req() req: Request) {
    try {
      const resp = await this.forumService.findMyPost(req.user.id);
      return this.sendSuccessResponse(resp, 'Forums fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns the forum information by forum id' })
  async findOne(@Param('id') id: string) {
    try {
      const resp = await this.forumService.findOne(id);
      return this.sendSuccessResponse(resp, 'Forum fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  // Comment on post
  @Post('/comment/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns the forum information with added comment' })
  async addComment(
    @Param('id') id: string,
    @Body() payload: AddCommentDto,
    @Req() req: Request,
  ) {
    try {
      const resp = await this.forumService.addComment(id, payload, req.user.id);
      return this.sendSuccessResponse(resp, 'Forum fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('/comment/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit the comment with the provided comment id' })
  async editComment(
    @Param('id') commentId: string,
    @Body() payload: EditCommentDTO,
    @Req() req: Request,
  ) {
    try {
      const resp = await this.forumService.editComment(
        commentId,
        payload,
        req.user,
      );
      return this.sendSuccessResponse(resp, 'Updated Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Delete('/comment/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit the comment with the provided comment id' })
  async deleteComment(@Param('id') id: string, @Req() req: Request) {
    try {
      const result = await this.forumService.deleteComment(id, req.user);
      return this.sendSuccessResponse(result, 'Deleted successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }
}
