import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import ResponseHandler from '@utils/response.handler';
import { Request } from 'express';
import { PaymentService } from '@payment/payment.service';
import { CreateOrderDTO } from '@payment/dto/create-order.dto';
import { VerifyPaymentDTO } from '@payment/dto/verify-payment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@security/guards/auth.guard';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { StripePaymentService } from './stripe-payment.service';
import * as moment from 'moment';
import { MailService } from '@mail/mail.service';
import { getEnrollmentMailBody } from '@utils/helpers/mailbody.helper';
import { EnrollDirectDTO } from './dto/enroll-direct.dto';
import { Payment } from './entities/payment.entity';

@ApiTags('Payment-Controller')
@UseInterceptors(TransformInterceptor)
@Controller('payment')
export class PaymentController extends ResponseHandler {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripePaymentService: StripePaymentService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  /*
   * Single Payment Flow

  */
  @ApiBearerAuth()
  @Post('/create-order')
  @UseGuards(AuthGuard)
  async createOrder(
    @Body() req: CreateOrderDTO,
    @Req() request: Request,
    @Headers('timezone') timezone: string,
  ) {
    try {
      const order = await this.paymentService.createOrder(
        req,
        request.user['id'],
        timezone,
      );
      if (order.status === 'created')
        return this.sendSuccessResponse(
          order,
          'New order created successfully',
        );
      if (order.paymentStatus === 'paid')
        return this.sendSuccessResponse(
          order,
          'New order created successfully',
        );
      throw new Error('Invalid order');
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('verify-payment')
  async paymentVerification(
    @Body() req: VerifyPaymentDTO,
    @Res() res: Response,
  ) {
    try {
      const resp = await this.paymentService.paymentVerification(req);
      if (resp) return res.redirect(process.env.WEBSITE_DOMAIN);
    } catch (error) {
      console.log('Error : ', error.message);
      return res.redirect(`${process.env.WEBSITE_DOMAIN}/payment/failed`);
    }
  }

  @Post('/verify-webook')
  async paymentVerifyHook(@Body() req: any, @Headers() headers: any) {
    try {
      const resp = await this.paymentService.paymentVerifyHook(req, headers);
      if (resp instanceof Payment) {
        const mailBody = getEnrollmentMailBody({
          courseName: resp.batch.course.courseName,
          studentName: resp.auth.name,
          duration: resp.batch.totalDuration * resp.batch.totalSession,
          startDate: moment(resp.batch.startDate)
            .tz(resp.auth.timeZone)
            .format('DD MMMM yyyy'),
          startTime: moment(resp.batch.startDate)
            .tz(resp.auth.timeZone)
            .format('hh:mm a'),
        });
        if (resp.paymentStatus === 'captured')
          this.mailService.sendViaSendGrid({
            to: resp.auth.email,
            subject: 'Thank you for Enrolling with SnowLabs Technology',
            text: mailBody,
          });
        return this.sendSuccessResponse(resp, 'Payment Webhook');
      } else {
        console.log(resp);
        return this.sendSuccessResponse(true, 'Handling Request');
      }
    } catch (error) {
      // console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('direct-enrollment')
  async enrollDirectly(@Body() payload: EnrollDirectDTO) {
    try {
      const result = await this.paymentService.afterPaymentOperations(
        payload.orderId,
      );
      return this.sendSuccessResponse(result, 'Successfully Enrolled');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('stripe/create')
  async createSession(@Body() orderPayload: CreateOrderDTO) {
    try {
      const result = await this.stripePaymentService.createSession(
        orderPayload,
      );
      return this.sendSuccessResponse(result, 'Created Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('stripe/webhook')
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    try {
      const result = await this.stripePaymentService.stripeWebhook(req);
      return this.sendSuccessResponse(result, 'Webhook hit');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Get('stripe/verify/:id')
  async verifyPayment(@Param('id') id: string) {
    try {
      const result = await this.stripePaymentService.verifyStripePayment(id);
      return this.sendSuccessResponse(result, 'Payment Successful');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }
}
