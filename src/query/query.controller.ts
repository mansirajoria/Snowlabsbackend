import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UsePipes,
  ParseUUIDPipe,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { QueryService } from './query.service';
import ResponseHandler from '@utils/response.handler';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryLeadDTO } from './dto/query-lead.dto';
import { CreateLeadDTO } from './dto/create-lead.dto';
import { UpdateLeadDTO } from './dto/update-lead.dto';
import { UpdateCorporateLeadDTO } from './dto/update-corporate-lead.dto';
import { UpdateDateColumn } from 'typeorm';
import { CreateCorporateLeadDTO } from './dto/create-corporate-lead.dto';
import { QueryType } from '@utils/enum';
import { CreateHelpdeskDTO } from './dto/create-helpdesk.dto';
import { QueryHelpdeskDTO } from './dto/query-helpdesk.dto';
import { UpdateHelpdeskDTO } from './dto/update-helpdesk.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { QueryCorporateLeadDTO } from './dto/query-corporate-lead.dto';
import axios from 'axios';
import { NotificationsService } from '@notifications/notifications.service';

@UseInterceptors(TransformInterceptor)
@ApiTags('Query-Controller')
@Controller('query')
export class QueryController extends ResponseHandler {
  constructor(
    private readonly queryService: QueryService,
    private notificationRepo: NotificationsService,
  ) {
    super();
  }

  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'queryId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @Get('/leads')
  async getLeads(@Query() queryDto: QueryLeadDTO) {
    try {
      const res = await this.queryService.findAllLeads(
        queryDto,
        QueryType.Lead,
      );
      return this.sendSuccessResponse(res, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
  @Post('/leads')
  async create(@Body() createQueryDto: CreateLeadDTO) {
    try {
      const res = await this.queryService.createLead(
        createQueryDto,
        QueryType.Lead,
      );
      return this.sendSuccessResponse(res, 'Submitted successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @UsePipes(ParseUUIDPipe)
  @Get('/leads/:id')
  async getOneLead(@Param('id') id: string) {
    try {
      const res = await this.queryService.findOneLead(id);
      return this.sendSuccessResponse(res, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch('/leads/:id')
  async updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLeadDTO,
  ) {
    try {
      const res = await this.queryService.updateLead(id, updateDto);
      return this.sendSuccessResponse(res, 'Updated successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Delete('/leads/:id')
  async deleteLead(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const res = await this.queryService.softDelete(id);
      return this.sendSuccessResponse(res, 'Deleted successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'queryId', required: false, type: String })
  @Get('/helpdesk')
  async getHelpdesk(@Query() queryDto: QueryHelpdeskDTO) {
    try {
      const res = await this.queryService.findAllHelpdesk(queryDto);
      return this.sendSuccessResponse(res, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch('/helpdesk/:id')
  async updateHelpdesk(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateHelpdeskDTO,
  ) {
    try {
      const res = await this.queryService.updateHelpdesk(updateDto, id);
      let data: any = {
        title: 'Query Update',
        description: `new update found on Query id ${res.queryId}`,
        receiverType: 'Students',
        studentId: `${res.student.id}`,
      };
      let result = await this.notificationRepo.create(data);
      return this.sendSuccessResponse(res, 'Updated successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @UsePipes(ParseUUIDPipe)
  @Get('/helpdesk/:id')
  async getOneHelpdesk(@Param('id') id: string) {
    try {
      const res = await this.queryService.findOneHelpdesk(id);
      return this.sendSuccessResponse(res, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/helpdesk')
  async createHelpdesk(@Body() createQueryDto: CreateHelpdeskDTO) {
    try {
      const res = await this.queryService.createHelpdesk(createQueryDto);
      return this.sendSuccessResponse(res, 'Submitted successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Delete('/helpdesk/:id')
  async deleteHelpdesk(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const res = await this.queryService.softDeleteHelpdesk(id);
      return this.sendSuccessResponse(res, 'Deleted successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'queryId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @Get('/corporate')
  async getCorporate(@Query() queryDto: QueryCorporateLeadDTO) {
    try {
      const res = await this.queryService.findAllCoporateLead(queryDto);
      return this.sendSuccessResponse(res, 'Fetched successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/corporate')
  async createCoporate(@Body() createDto: CreateCorporateLeadDTO) {
    try {
      const res = await this.queryService.createCorporateLead(createDto);
      return this.sendSuccessResponse(res, 'Submitted successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch('/corporate/:id')
  async updateCorporate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCorporateLeadDTO,
  ) {
    try {
      const res = await this.queryService.updateCorporateLead(id, updateDto);
      return this.sendSuccessResponse(res, 'Updated successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/corporate/:id')
  async findOneCoporateLead(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const res = await this.queryService.findOneCorporateLead(id);
      return this.sendSuccessResponse(res, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Delete('/corporate/:id')
  async deleteCorporate(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const res = await this.queryService.softDeleteCorporate(id);
      return this.sendSuccessResponse(res, 'Deleted successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
