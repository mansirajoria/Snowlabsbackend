import { HttpStatus, Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { URLSearchParams } from 'url';
import HttpException from '@utils/exceptions/HttpException';
import { AuthTokentDto } from './dto/auth-token.dto';
import { MeetDto, ProfileDto } from './dto/response.dto';
import { CreateMeetDto, UpdateMeetDto } from './dto/meet.dto';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';

import axios from 'axios';
import * as qs from 'qs';
import { MicrosoftSearchDto } from './dto/query-ms.dto';
import { UploadsService } from 'uploads/uploads.service';

import {
  CreateTeamsWebinarDto,
  UpdateTeamsWebinarDto,
} from './dto/webinar.dto';
import { Trainer } from '@trainer/entities/trainer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  getWeekdays,
  convertTo24HourFormat,
  convertUTCtoIST,
  isNextDate,
} from '@utils/weekday.service';
import { CelenderDto } from './dto/celender.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Attendee } from './interface/attendess.interface';
import { CredentialEntity } from 'credential/entities/credential.entity';
import * as moment from 'moment';
import { Webinar } from '@webinars/entities/webinar.entity';
import { SessionEntity } from '@session/entities/session.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { ResourceType } from '@utils/enum';
import { Batch } from 'aws-sdk';
import { BatchEntity } from '@batch/entities/batch.entity';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { start } from 'repl';

@Injectable()
export class MicrosoftTeamService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly uploadsService: UploadsService,
    @InjectRepository(Trainer)
    private trainerRepo: Repository<Trainer>,
    @InjectRepository(AuthEntity)
    private authRepo: Repository<AuthEntity>,

    @InjectRepository(CredentialEntity)
    private credentialRepo: Repository<CredentialEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(Webinar)
    private webinarRepo: Repository<Webinar>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
    @InjectRepository(ResourceEntity)
    private resourceRepo: Repository<ResourceEntity>,
  ) {}

  convertUTCtoLocalNext(utcDateString: Date): string {
    return moment(utcDateString).tz('Asia/Calcutta').format('LT');
  }

  async authUrl(): Promise<string> {
    const clientId = this.configService.get('team.clientId');
    const scope = this.configService.get('team.scope');
    const redirectUrl = this.configService.get('team.redirectUrl');

    const URL = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUrl}&response_mode=query&scope=${scope}&state=outlook`;
    const response = await this.httpService.axiosRef
      .get(URL)
      .then(() => URL)
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async authToken(code: string): Promise<AuthTokentDto> {
    const URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const params = new URLSearchParams();
    params.append('client_id', this.configService.get('team.clientId'));
    params.append('scope', this.configService.get('team.scope'));
    params.append('code', code);
    params.append('redirect_uri', this.configService.get('team.redirectUrl'));
    params.append('grant_type', 'authorization_code');
    params.append('client_secret', this.configService.get('team.secretId'));

    const data = params.toString();

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const response = await this.httpService.axiosRef
      .post(URL, data, config)
      .then((response) => response.data)
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  @Cron('*/55 * * * *')
  async accesTokenGenerate() {
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    const URL = `https://login.microsoftonline.com/${this.configService.get(
      'team.tenantId',
    )}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', this.configService.get('team.clientId'));
    //params.append('scope', this.configService.get('team.refreshScope'));
    params.append('refresh_token', credential.outLookRefreshToken);
    params.append('grant_type', 'refresh_token');
    params.append('client_secret', this.configService.get('team.secretId'));
    const data = params.toString();
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    const response = await this.httpService.axiosRef
      .post(URL, data, config)
      .then((response) => response.data)
      .catch((e) => {
        console.log(e);
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    credential.outLookToken = response.access_token;
    credential.outLookRefreshToken = response.refresh_token;
    await this.credentialRepo.save(credential);
  }

  async profile(token: string): Promise<ProfileDto> {
    const URL = 'https://graph.microsoft.com/v1.0/me';

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await this.httpService.axiosRef
      .get(URL, config)
      .then((response) => {
        return {
          email: response?.data?.userPrincipalName,
          name: response?.data?.displayName,
        };
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async createMeeting(
    createMeetDto: CreateMeetDto,
    token: string,
  ): Promise<MeetDto> {
    const URL = 'https://graph.microsoft.com/v1.0/me/events';
    let meetEndDate: string;
    const trainerDetails: Trainer = await this.trainerRepo.findOne({
      where: { id: createMeetDto.trainerId },
      relations: ['auth'],
    });
    if (!trainerDetails) throw new HttpException(404, 'Trainer not found');
    const startTime: string = convertTo24HourFormat(createMeetDto.startTime);
    const endTime: string = convertTo24HourFormat(createMeetDto.endTime);
    const meetStartTime = `${createMeetDto.startDate}T${startTime}:00`;
    const isNextDateAvailable: boolean = isNextDate(
      createMeetDto.startTime,
      createMeetDto.endTime,
    );
    if (isNextDateAvailable) {
      meetEndDate = moment(createMeetDto.startDate, 'YYYY-MM-DD')
        .add(1, 'days')
        .format('YYYY-MM-DD');
    }
    const meetEndTime = `${
      isNextDateAvailable ? meetEndDate : createMeetDto.startDate
    }T${endTime}:00`;
    const days: string[] = getWeekdays(createMeetDto.weekDays);
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const reqObject = {
      subject: createMeetDto.courseName,
      body: {
        contentType: 'HTML',
        content: createMeetDto.courseName,
      },
      start: {
        dateTime: `${meetStartTime}`,
        timeZone: 'India Standard Time',
      },
      end: {
        dateTime: `${meetEndTime}`,
        timeZone: 'India Standard Time',
      },
      recurrence: {
        pattern: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: days,
        },
        range: {
          type: 'endDate',
          startDate: `${createMeetDto.startDate}`,
          endDate: `${createMeetDto.endDate}`,
        },
      },
      attendees: [
        {
          emailAddress: {
            address: `${trainerDetails.auth.email}`,
            name: `${trainerDetails.auth.name}`,
          },
          type: 'required',
        },
      ],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    };
    const response = await this.httpService.axiosRef
      .post(URL, reqObject, config)
      .then((response) => {
        return {
          id: response?.data?.id,
          link: response?.data?.onlineMeeting?.joinUrl,
          callId: response?.data?.iCalUId,
        };
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async createWebinar(
    createMeetDto: CreateTeamsWebinarDto,
    token: string,
  ): Promise<MeetDto> {
    let meetEndDate: string;
    const URL = 'https://graph.microsoft.com/v1.0/me/events';
    const trainerDetails: Trainer = await this.trainerRepo.findOne({
      where: { id: createMeetDto.trainerId },
      relations: ['auth'],
    });
    if (!trainerDetails) throw new HttpException(404, 'Trainer not found');
    const startTime: string = convertTo24HourFormat(createMeetDto.startTime);
    const endTime: string = convertTo24HourFormat(createMeetDto.endTime);
    const meetStartTime = `${createMeetDto.startDate}T${startTime}:00`;
    const isNextDateAvailable: boolean = isNextDate(
      createMeetDto.startTime,
      createMeetDto.endTime,
    );
    if (isNextDateAvailable) {
      meetEndDate = moment(createMeetDto.startDate, 'YYYY-MM-DD')
        .add(1, 'days')
        .format('YYYY-MM-DD');
    }
    const meetEndTime = `${
      isNextDateAvailable ? meetEndDate : createMeetDto.startDate
    }T${endTime}:00`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const reqObject = {
      subject: createMeetDto.webinarName,
      body: {
        contentType: 'HTML',
        content: 'Webinar',
      },
      start: {
        dateTime: `${meetStartTime}`,
        timeZone: 'India Standard Time',
      },
      end: {
        dateTime: `${meetEndTime}`,
        timeZone: 'India Standard Time',
      },
      attendees: [
        {
          emailAddress: {
            address: `${trainerDetails.auth.email}`,
            name: `${trainerDetails.auth.name}`,
          },
          type: 'required',
        },
      ],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      transactionId: uuidv4(),
    };

    const response = await this.httpService.axiosRef
      .post(URL, reqObject, config)
      .then((response) => {
        return {
          id: response?.data?.id,
          link: response?.data?.onlineMeeting?.joinUrl,
          callId: response?.data?.iCalUId,
        };
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async getToken(): Promise<any> {
    const data = qs.stringify({
      grant_type: this.configService.get('team.grantType'),
      client_id: this.configService.get('team.clientId'),
      client_secret: this.configService.get('team.secretId'),
      resource: this.configService.get('team.resource'),
    });
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://login.microsoftonline.com/${this.configService.get(
        'team.tenantId',
      )}/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      data: data,
    };
    const response = await axios
      .request(config)
      .then((response) => {
        return { access_token: response?.data?.access_token };
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async searchSites(
    searchDto: MicrosoftSearchDto,
    accessToken: string,
  ): Promise<any> {
    const config = {
      method: 'get',
      url: 'https://graph.microsoft.com/v1.0/sites',
      headers: {
        Authorization: accessToken,
      },
    };
    const response = await axios(config);
    const sitesData = response.data.value;

    const filteredSites = sitesData.filter(
      (site: { name: string }) => site.name === 'SnowLabs Trainer',
    );
    return filteredSites;
  }

  async getDriveRoot(
    siteId: string,
    file: string,
    accessToken: string,
  ): Promise<any> {
    const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${file}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: accessToken,
      },
    });
    return response.data;
  }

  async downloadFile(downloadUrl: string, access_token: string): Promise<any> {
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((response) => response.data)
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async contentList(access_token: string): Promise<any> {
    const response = await axios({
      url: `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/items/${process.env.RECORDING_ID}/children`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((response) => response.data)
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async deleteContent(access_token: string, itemId: string): Promise<any> {
    const response = await axios({
      url: `https://graph.microsoft.com/v1.0/drives/${process.env.DRIVE_ID}/items/${itemId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((response) => response.data)
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  @Cron('0 */1 * * *')
  async uploadRecordingToAWs() {
    try {
      const { access_token } = await this.getToken();
      const fileList = await this.contentList(access_token);
      if (fileList.value.length) {
        const promises = fileList.value.map(async (file) => {
          const callId: string = file.source.iCalUid;
          const [webinarDetails, sessionDetails] = await Promise.all([
            this.webinarRepo.findOne({
              where: { callId },
            }),
            this.sessionRepo.findOne({
              where: { callId },
              relations: ['batch'],
            }),
          ]);
          const fileDownloadUrl: string = `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/items/${file.id}/content`;
          const fileData = await this.downloadFile(
            fileDownloadUrl,
            access_token,
          );
          const meetRecordingUrl: string =
            await this.uploadsService.uploadFileToS3(
              fileData,
              webinarDetails
                ? `Recording/${webinarDetails.title}`
                : sessionDetails
                ? `Recording/${sessionDetails.batch.batchId}/${sessionDetails.sessionName}/${file.name}`
                : `Recording/${file.name}`,
            );
          if (webinarDetails) {
            webinarDetails.recordingUrl = meetRecordingUrl;
            await this.webinarRepo.save(webinarDetails);
          }
          if (sessionDetails) {
            const newResource = new ResourceEntity();
            newResource.resourceName = file.name;
            newResource.resourceLink = meetRecordingUrl;
            newResource.session = sessionDetails;
            newResource.resourceType = ResourceType.RECORDING;
            newResource.isPublish = true;

            await this.resourceRepo.save(newResource);
          }
          console.log(meetRecordingUrl);
          await this.deleteContent(access_token, file.id);
        });
        await Promise.all(promises);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async fetchCelender(searchDto: CelenderDto): Promise<any> {
    const startDate = moment(searchDto.startDate, 'YYYY-MM-DD')
      .startOf('day')
      .toDate();
    const endDate = moment(searchDto.endDate, 'YYYY-MM-DD')
      .endOf('day')
      .toDate();
    const batchSchedulePromise = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.sessionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .innerJoinAndSelect('session.batch', 'batch')
      .select([
        'batch.batchId AS "batchId"',
        'session.sessionDate AS "startDate"',
        'session.sessionEndDate AS "endDate"',
        'session.id AS "id"',
      ])
      .getRawMany();
    const webinarSchedulePromise = this.webinarRepo.find({
      where: { startDate: Between(startDate, endDate) },
      select: ['title', 'startDate', 'id', 'endDate'],
    });
    const [batches, webinars] = await Promise.all([
      batchSchedulePromise,
      webinarSchedulePromise,
    ]);
    const calender = [...batches, ...webinars];

    return calender;
  }

  async attendeesList(
    accessToken: string,
    eventId: string,
  ): Promise<Attendee[]> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}?$select=subject,body,bodyPreview,organizer,attendees,start,end,location,locations`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const response = await this.httpService.axiosRef
      .get(URL, config)
      .then((response) => {
        return response?.data?.attendees;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async enrollStudentIntoEvent(
    eventId: string,
    accessToken: string,
    studentName: string,
    studentEmail: string,
  ): Promise<boolean> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const attendees: Array<Object> = await this.attendeesList(
      accessToken,
      eventId,
    );
    attendees.push({
      emailAddress: {
        address: `${studentEmail}`,
        name: `${studentName}`,
      },
      type: 'optional',
    });
    const reqObject = {
      attendees,
    };
    const response = await this.httpService.axiosRef
      .patch(URL, reqObject, config)
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async sendInvitation(
    invitationDto: SendInvitationDto,
    accessToken: string,
  ): Promise<boolean> {
    const { invitation } = invitationDto;
    const URL = `https://graph.microsoft.com/v1.0/me/events/${invitationDto.meetingId}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const attendees: Array<Object> = await this.attendeesList(
      accessToken,
      invitationDto.meetingId,
    );
    for (let i = 0; i < invitation.length; i++) {
      attendees.push({
        emailAddress: {
          address: `${invitation[i].email}`,
          name: `${invitation[i].name}`,
        },
        type: 'optional',
      });
    }
    const reqObject = {
      attendees,
    };
    const response = await this.httpService.axiosRef
      .patch(URL, reqObject, config)
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }
  async unenrollStudentFromEvent(
    eventId: string,
    accessToken: string,
    studentEmail: string,
  ): Promise<boolean> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    let attendees: Attendee[] = await this.attendeesList(accessToken, eventId);
    attendees = attendees.filter(
      (attendee) => attendee?.emailAddress.address !== studentEmail,
    );
    const reqObject: Object = {
      attendees,
    };

    const response = await this.httpService.axiosRef
      .patch(URL, reqObject, config)
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async cancelEvent(accessToken: string, eventId: string): Promise<boolean> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}/cancel`;
    const response = await axios({
      url: URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }
  async eventDetails(eventId: string, accessToken: string): Promise<any> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}?$select=start,end`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="India Standard Time"',
      },
    };
    const response = await this.httpService.axiosRef
      .get(URL, config)
      .then((response) => {
        return response?.data;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }
  async updateWebinarEvent(
    updateWebinarDto: UpdateTeamsWebinarDto,
    accessToken: string,
    eventId: string,
  ): Promise<boolean> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const reqObject = {};
    let meetStartTime: string;
    let meetEndTime: string;
    if (updateWebinarDto.startDate) {
      meetStartTime = convertUTCtoIST(updateWebinarDto.startDate.toISOString());
      meetStartTime = meetStartTime.split('.')[0];
      reqObject['start'] = {
        dateTime: `${meetStartTime}`,
        timeZone: 'India Standard Time',
      };
    }
    if (updateWebinarDto.endDate) {
      meetEndTime = convertUTCtoIST(updateWebinarDto.endDate.toISOString());
      const startTime = this.convertUTCtoLocalNext(updateWebinarDto.startDate);
      const endTime = this.convertUTCtoLocalNext(updateWebinarDto.endDate);
      const isNextDateAvailable: boolean = isNextDate(startTime, endTime);
      if (isNextDateAvailable) {
        meetEndTime = moment(meetEndTime).add(1, 'days').toISOString();
      }
      meetEndTime = meetEndTime.split('.')[0];
      reqObject['end'] = {
        dateTime: `${meetEndTime}`,
        timeZone: 'India Standard Time',
      };
    }
    if (updateWebinarDto.webinarName) {
      reqObject['subject'] = updateWebinarDto.webinarName;
    }
    if (updateWebinarDto.newTrainerEmail) {
      const promise1 = this.unenrollStudentFromEvent(
        eventId,
        accessToken,
        updateWebinarDto.oldTrainerEmail,
      );
      const promise2 = this.enrollStudentIntoEvent(
        eventId,
        accessToken,
        updateWebinarDto.newTrainerName,
        updateWebinarDto.newTrainerEmail,
      );
      await Promise.all([promise1, promise2]);
    }

    const response = await this.httpService.axiosRef
      .patch(URL, reqObject, config)
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async updateBatchEvent(
    updateBatchDto: UpdateMeetDto,
    accessToken: string,
    eventId: string,
    isSession?: boolean,
  ): Promise<boolean> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const reqObject = {};
    let meetStartTime: string;
    let meetEndTime: string;
    let days: string[];
    let currentDate: string = moment().format('YYYY-MM-DD');
    if (updateBatchDto.startDate && !isSession) {
      meetStartTime = convertUTCtoIST(updateBatchDto.startDate.toISOString());
      meetStartTime = meetStartTime.split('.')[0].split('T')[1];
      const startDateTime = `${currentDate}T${meetStartTime}`;
      reqObject['start'] = {
        dateTime: `${startDateTime}`,
        timeZone: 'India Standard Time',
      };
    }
    if (updateBatchDto.endDate && !isSession) {
      meetEndTime = convertUTCtoIST(updateBatchDto.endDate.toISOString());
      meetEndTime = meetEndTime.split('.')[0].split('T')[1];
      const startTime = this.convertUTCtoLocalNext(updateBatchDto.startDate);
      const endTime = this.convertUTCtoLocalNext(updateBatchDto.endDate);
      const isNextDateAvailable: boolean = isNextDate(startTime, endTime);
      if (isNextDateAvailable) {
        currentDate = moment(currentDate, 'YYYY-MM-DD')
          .add(1, 'days')
          .format('YYYY-MM-DD');
      }
      const endDateTime = `${currentDate}T${meetEndTime}`;
      reqObject['end'] = {
        dateTime: `${endDateTime}`,
        timeZone: 'India Standard Time',
      };
    }
    if (updateBatchDto.weekDays.length) {
      days = getWeekdays(updateBatchDto.weekDays);
      const startDate = moment(updateBatchDto.startDate).format('YYYY-MM-DD');
      const endDate = moment(updateBatchDto.endDate).format('YYYY-MM-DD');
      console.log(endDate, 7161);
      reqObject['recurrence'] = {
        pattern: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: days,
        },
        range: {
          type: 'endDate',
          startDate,
          endDate,
        },
      };
    }
    if (updateBatchDto.newTrainerEmail) {
      const promise1 = this.unenrollStudentFromEvent(
        eventId,
        accessToken,
        updateBatchDto.oldTrainerEmail,
      );
      const promise2 = this.enrollStudentIntoEvent(
        eventId,
        accessToken,
        updateBatchDto.newTrainerName,
        updateBatchDto.newTrainerEmail,
      );
      await Promise.all([promise1, promise2]);
    }

    const response = await this.httpService.axiosRef
      .patch(URL, reqObject, config)
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async updateSessionEvent(
    updateSessionDto: UpdateMeetDto,
    accessToken: string,
    eventId: string,
  ): Promise<boolean> {
    const URL = `https://graph.microsoft.com/v1.0/me/events/${eventId}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const reqObject = {};
    let meetStartTime: string;
    let meetEndTime: string;

    const response = await this.httpService.axiosRef
      .patch(URL, reqObject, config)
      .then((response) => {
        return true;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }

  async occurrenceOfEvent(
    accessToken: string,
    eventId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    // console.log(startDate, endDate);
    startDate = moment(new Date(startDate), 'YYYY-MM-DD')
      .subtract(1, 'days')
      .format('YYYY-MM-DD');
    endDate = moment(new Date(endDate), 'YYYY-MM-DD')
      .add(1, 'days')
      .format('YYYY-MM-DD');
    const URL: string = `https://graph.microsoft.com/v1.0/me/events/${eventId}/instances?startDateTime=${startDate}&endDateTime=${endDate}&top=100&select=start,end,iCalUId,id,onlineMeeting`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const response = await this.httpService.axiosRef
      .get(URL, config)
      .then((response) => {
        return response?.data?.value;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    return response;
  }
}
