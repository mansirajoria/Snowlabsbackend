import { HttpStatus, Injectable, RawBodyRequest } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stripe } from 'stripe';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { CreateOrderDTO } from './dto/create-order.dto';
import { Course } from '@courses/entities/course.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import HttpException from '@utils/exceptions/HttpException';
import { AuthEntity } from '@auth/entities/auth.entity';
import { BatchService } from '@batch/batch.service';
import { Request } from 'express';
import { GatewayEnum, PaymentStatusEnum } from '@utils/enum';
import { PaymentService } from './payment.service';
import { Student } from '@students/entities/student.entity';

@Injectable()
export class StripePaymentService {
  private stripeService: Stripe;
  private webhook_secret: string;
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(AuthEntity)
    private readonly authRepo: Repository<AuthEntity>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly batchService: BatchService,
    private readonly paymentService: PaymentService,
  ) {
    this.stripeService = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
    this.webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  async createSession(payload: CreateOrderDTO) {
    const { name, currency, authId, batchId, courseId } = payload;
    const batch = await this.batchService.findOne(batchId);
    if (!batch)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Batch ID');
    const auth = await this.authRepo.findOne({
      where: { id: authId },
    });
    if (!auth)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Auth ID');
    const student = await this.studentRepo.findOne({
      where: { auth: { id: auth.id } },
    });
    const enrollment = await this.enrollmentRepo.findOne({
      where: { student: { id: student.id }, batch: { id: batchId } },
    });
    if (enrollment)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Student already enrolled',
      );
    auth.name = name;
    await this.authRepo.save(auth);

    const amount =
      currency === 'inr' ? batch.inrAmount * 100 : batch.dollorAmount * 100;

    const session = await this.stripeService.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: { name: batch.course.courseName },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    const payment = new Payment();
    payment.gatewayUsed = GatewayEnum.STRIPE;
    payment.gatewayOrderId = session.id;
    payment.paymentStatus = PaymentStatusEnum.CREATED;
    payment.batch = batch;
    payment.course = batch.course;
    payment.auth = auth;
    payment.currency = currency;
    payment.amount = amount / 100;
    await this.paymentRepo.save(payment);

    return { url: session.url };
  }

  async stripeWebhook(request: RawBodyRequest<Request>) {
    let event: any;

    if (this.webhook_secret) {
      const signature = request.headers['stripe-signature'];
      try {
        event = this.stripeService.webhooks.constructEvent(
          request.rawBody,
          signature,
          this.webhook_secret,
        );
      } catch (err) {
        console.log(err);
        console.log('Webhook signature verfication failed');
        const payment = await this.paymentRepo.findOne({
          where: { gatewayOrderId: request.body.data.object.id },
        });
        payment.paymentStatus = PaymentStatusEnum.FAILED;
        await this.paymentRepo.save(payment);
        return err.message;
      }
    } else {
      event = request.body;
    }
    if (event.type === 'checkout.session.completed') {
      const payment = await this.paymentRepo.findOne({
        where: { gatewayOrderId: event.data.object.id },
      });
      payment.paymentStatus = PaymentStatusEnum.PAID;
      await this.paymentRepo.save(payment);
      await this.paymentService.afterPaymentOperations(event.data.object.id);
    }

    return;
  }

  async verifyStripePayment(orderId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { gatewayOrderId: orderId },
      relations: { batch: true, auth: true },
    });
    if (!payment)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Order not found');
    if (payment.paymentStatus === PaymentStatusEnum.PAID)
      return { status: true, payment };
    throw new HttpException(HttpStatus.BAD_REQUEST, 'Payment Failed');
  }
}
