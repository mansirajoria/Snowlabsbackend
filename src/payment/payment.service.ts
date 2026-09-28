import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRazorpay } from 'nestjs-razorpay';
import Razorpay from 'razorpay';
import { CreateOrderDTO } from './dto/create-order.dto';
import { VerifyPaymentDTO } from './dto/verify-payment.dto';
import * as crypto from 'crypto';
import HttpException from '@utils/exceptions/HttpException';
import { Payment } from './entities/payment.entity';
import { CoursesService } from '@courses/courses.service';
import { BatchService } from '@batch/batch.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomRepositoryDoesNotHaveEntityError, Repository } from 'typeorm';
import { StudentsService } from '@students/students.service';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Course } from '@courses/entities/course.entity';
import { Student } from '@students/entities/student.entity';
import { EnrollStudentDto } from '@batch/dto/enrollStudent.dto';
import { MailService } from '@mail/mail.service';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from '@notifications/notifications.service';
import {
  AssignmentEnum,
  FeedBackType,
  GatewayEnum,
  PaymentStatusEnum,
  RazorpayEventEnum,
  ReferralCouponStatus,
  RewardCouponStatus,
  enrollmentType,
} from '@utils/enum';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { FeedbackSubmission } from 'feedbacks/entities/feedback-form-submission.entity';
import { Referral } from 'referral/entities/referral.entity';
import { Offers } from 'offers/entities/offers.entity';
import { OfferRedeemed } from 'offers/entities/offer-redeemed.entity';
import { RequestLoggerMiddleware } from '@utils/interceptors/request-logger.middleware';
import { CredentialEntity } from 'credential/entities/credential.entity';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CredentialEntity)
    private credentialRepo: Repository<CredentialEntity>,
    @InjectRepository(FeedbackSubmission)
    private feedbackSubmissionRepo: Repository<FeedbackSubmission>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRazorpay() private readonly razorpayClient: Razorpay,
    @InjectRepository(Offers)
    private readonly offerRepo: Repository<Offers>,
    @InjectRepository(OfferRedeemed)
    private readonly offerReedeemRepo: Repository<OfferRedeemed>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    private readonly courseService: CoursesService,
    private readonly studentService: StudentsService,
    private readonly mailService: MailService,
    private notificationRepo: NotificationsService,
    private batchService: BatchService,
    private configService: ConfigService,
  ) {}

  // async startPayment(req: PaymentDTO) {
  //   const response = await this.razorpayClient.paymentLink.create({
  //     amount: req.amount,
  //     currency: req.currency,
  //     accept_partial: false,
  //     first_min_partial_amount: 100,
  //     description: 'SnowLabs Technology',
  //     customer: {
  //       name: req.name,
  //       email: req.email,
  //       contact: req.number,
  //     },
  //     notify: {
  //       sms: true,
  //       email: true,
  //     },
  //     reminder_enable: true,
  //     callback_url: `http://localhost:3000/api/payment/paymentprocess`, // frontend success page callback_url will contain the data
  //     callback_method: 'get',
  //   });
  //   return response;
  // }

  async testcyn() {
    return this.configService.get('payment.domesticCharges', { infer: true });
  }

  async createOrder(payload: CreateOrderDTO, id: string, timezone?: string) {
    const findBatch = await this.batchService.findOne(payload.batchId);

    if (!findBatch)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Batch not found');
    // Student Enrollment Check
    console.log(payload);
    console.log(findBatch.batchType);
    console.log(id);
    const enrollmentCheck = await this.enrollmentRepo.findOne({
      where: {
        batch: {
          course: { id: payload.courseId },
          batchType: findBatch.batchType,
        },
        student: { auth: { id } },
      },
    });
    console.log(enrollmentCheck);
    if (enrollmentCheck)
      throw new HttpException(HttpStatus.CONFLICT, 'User Already Enrolled');

    const findStudent = await this.studentRepo.findOne({
      where: { auth: { id } },
      relations: ['auth'],
    });

    if (!findStudent)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'User not found');

    const findAuth = await this.authRepo.findOne({
      where: { id: findStudent.auth.id },
    });
    findAuth.name = payload.name;
    findAuth.timeZone = timezone;
    const findCourse = await this.courseRepo.findOne({
      where: { id: payload.courseId },
      relations: [
        'courseCategory',
        'batch',
        'currilculum',
        'faqs',
        'trainingPlans',
      ],
    });
    const usdDetails = await this.credentialRepo.findOne({
      where: { type: 'USD' },
      select: { value: true },
    });

    const { amount, currency, promoId, isOffer } = payload;

    const payment = new Payment();

    let discount: number = 0;
    let payAmount: number;

    if (currency === 'inr' || currency === 'INR')
      payAmount = Number(findBatch.inrAmount);

    if (currency === 'usd' || currency === 'USD')
      payAmount = Number(findBatch.dollorAmount);

    if (isOffer && promoId) {
      const offer = await this.offerRepo.findOne({ where: { id: promoId } });
      discount = (payAmount * offer.discountPercentile) / 100;

      payment.offer = offer;
    }

    if (!isOffer && promoId) {
      const referral = await this.referralRepo.findOne({
        where: { id: promoId },
      });
      discount =
        currency === 'usd' || currency === 'USD'
          ? referral.discountValueInUSD
          : referral.discountValueInINR;

      const savedReferral = await this.referralRepo.save(referral);
      payment.referral = savedReferral;
    }

    payAmount = payAmount - discount;

    const taxAmount =
      currency === 'inr' || currency === 'INR'
        ? payAmount *
          (this.configService.get('payment.gst', { infer: true }) / 100 || 0.18)
        : 0;
    payAmount += taxAmount;

    if (payAmount <= 0) payAmount = 0;

    let order = null;

    if (payAmount > 0) {
      console.log(payAmount);
      order = await this.razorpayClient.orders.create({
        amount: parseInt((Number(payAmount) * 100).toFixed(0), 10),
        currency: currency.toUpperCase(),
        notes: {
          batchId: payload.batchId,
          courseId: payload.courseId,
        },
      });
      if (!order)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Order not created');
    }
    payment.gatewayUsed = GatewayEnum.RAYZOR;
    payment.amount =
      currency === 'inr' || currency === 'INR'
        ? Number(findBatch.inrAmount)
        : findBatch.dollorAmount;
    payment.currency = currency;
    payment.paymentStatus = order?.status || 'paid';
    payment.gatewayOrderId = order?.id || uuidv4(); // OR OrderId
    payment.offlinePayment = false;
    payment.tax = currency === 'inr' || currency === 'INR' ? taxAmount : 0;
    payment.total =
      currency === 'inr' || currency === 'INR'
        ? Number(payAmount)
        : Number(payAmount) * usdDetails.value;
    payment.gatewayCharges =
      currency === 'inr' || currency === 'INR'
        ? Number(
            payment.total *
              (this.configService.get('payment.domesticCharges', {
                infer: true,
              }) / 100 || 0.0175),
          )
        : Number(
            payment.total *
              (this.configService.get('payment.internationalCharges', {
                infer: true,
              }) / 100 || 0.03),
          );

    payment.auth = findAuth;
    payment.course = findCourse;
    payment.batch = findBatch;

    await Promise.all([
      this.paymentRepo.save(payment),
      this.authRepo.save(findAuth),
    ]);

    if (order) return order;
    await this.afterPaymentOperations(payment.gatewayOrderId);
    return payment;
  }

  async verifyPayment(orderId: any) {
    const payment = await this.paymentRepo.findOne({
      where: { gatewayOrderId: orderId },
      relations: ['auth'],
    });
    // console.log(payment);
    if (
      payment.paymentStatus === 'created' ||
      payment.paymentStatus === 'Credit' ||
      payment.paymentStatus === PaymentStatusEnum.PAID
    ) {
      const user = await this.authRepo.findOne({
        where: { id: payment.auth.id },
      });

      payment.paymentStatus = 'paid';
      await this.paymentRepo.save(payment);

      return {
        status: true,
        message: 'Payment verified',
        data: {
          transactionId: payment.transactionId,
          paymentId: payment.id,
          amount: payment.amount,
          tax: payment.tax,
          total: payment.total,
          mode: payment.paymentMode,
          date: payment.createdDate,
          user: user,
        },
      };
    } else {
      return { status: false, message: 'Payment pending' };
    }
  }

  async paymentVerification(payload: VerifyPaymentDTO) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payload;

    const createdSignature = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.KEY_SECRET)
      .update(createdSignature.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSignature)
      throw new HttpException(409, `Signature error !!`);

    const response = await this.verifyPayment(razorpay_order_id);

    if (response.status == true) {
      return response;
    } else {
      setTimeout(async () => {
        const secResponse = await this.verifyPayment(razorpay_order_id);
        if (secResponse.status == true)
          return secResponse.message, secResponse.data;
        return secResponse.message;
      }, 1000 * 30);
    }
    return true;
  }

  async paymentVerifyHook(req: any, headers: any) {
    console.log('Razorpay Webhook Received:', req);
    const event = req.event;

    let status = 'pending';
    if (event === RazorpayEventEnum.Captured) status = 'captured';
    else if (event === RazorpayEventEnum.Failed) status = 'failed';
    else return event;

    const orderSignature = headers['x-razorpay-signature'];
    const orderId = req.payload.payment.entity.order_id;
    const method = req.payload.payment.entity.method;

    const createdSignature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(JSON.stringify(req))
      .digest('hex');

    if (createdSignature !== orderSignature) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Signature not verified');
    }

    const updatePaymentStatus = await this.paymentRepo.findOne({
      where: { gatewayOrderId: orderId },
      relations: {
        referral: true,
        offer: true,
        batch: { course: true },
        auth: true,
      },
    });

    updatePaymentStatus.paymentStatus = status;
    updatePaymentStatus.paymentMode = method;

    const order = await this.paymentRepo.save(updatePaymentStatus);
    if (order.paymentStatus === 'captured') {
      await this.afterPaymentOperations(order.gatewayOrderId);
    }
    return order;
  }

  async afterPaymentOperations(order_id: string) {
    const findOrder = await this.paymentRepo.findOne({
      where: { gatewayOrderId: order_id },
      relations: {
        auth: true,
        batch: true,
        referral: true,
        offer: true,
        course: true,
      },
    });
    let findStudent: Student;
    if (!findOrder)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Order not found');
    let sid: string;
    let bid: string;

    if (findOrder.auth) {
      findStudent = await this.studentRepo.findOne({
        where: { auth: { id: findOrder.auth.id } },
      });
      sid = findStudent.id;
      const authDetails = await this.authRepo.findOne({
        where: { id: findOrder.auth.id },
      });
      authDetails.isActive = true;
      findStudent.enrollmentType = enrollmentType.ENROLLED;
      await this.studentRepo.save(findStudent);
      await this.authRepo.save(authDetails);
    }
    if (findOrder.batch) {
      const findBatch = await this.batchService.findOne(findOrder.batch.id);
      bid = findBatch.id;
    }
    if (findOrder.referral) {
      await this.redeemReferral(findOrder.referral);
    }
    if (findOrder.offer) {
      await this.redeemOffer(findOrder.offer, findOrder.auth, findOrder.course);
    }

    const enrollPayload: EnrollStudentDto = { studentId: sid, batchId: bid };

    await this.batchService.enrollStudent(enrollPayload);
    const batchDetails = await this.batchService.findOne(findOrder.batch.id);
    const preCourse = new FeedbackSubmission();
    preCourse.type = FeedBackType.PRE_COURSE;
    preCourse.student = findStudent;
    preCourse.status = AssignmentEnum.PENDING;
    preCourse.batch = batchDetails;
    preCourse.trainer = batchDetails.trainer;
    const postCourse = new FeedbackSubmission();
    postCourse.type = FeedBackType.POST_COURSE;
    postCourse.student = findStudent;
    postCourse.status = AssignmentEnum.PENDING;
    (postCourse.batch = batchDetails),
      (postCourse.trainer = batchDetails.trainer);
    await Promise.allSettled([
      this.feedbackSubmissionRepo.save(preCourse),
      this.feedbackSubmissionRepo.save(postCourse),
    ]);

    const findBatchDetails = await this.batchService.findOne(
      findOrder.batch.id,
    );

    await this.notificationRepo.create({
      title: 'Successful Course Enrollment',
      description: `Congratulations! You are successfully enrolled in the course ${findBatchDetails.course.courseName}`,
      studentId: `${sid}`,
      receiverType: 'Students',
    });

    // 👇 Zoho Integration
    try {
      const accessToken = await this.getZohoAccessToken();
      await this.createZohoCustomerAndInvoice(findOrder, accessToken);
      
    } catch (err) {
      console.error('Zoho Books error:', err?.response?.data || err);
      const errorDetails = {
          orderId: findOrder.id,
          studentId: findOrder.auth?.id,
          errorMessage: err?.response?.data?.message || err.message,
          timestamp: new Date().toISOString()
      };
      console.error('Error details:', errorDetails);
    }
  }

  // Get Zoho Access Token
  // This function is used to get the access token from Zoho Books API using the refresh token.
  // It makes a POST request to the Zoho Books API with the refresh token, client ID, and client secret.
  async getZohoAccessToken(): Promise<string> {
    const response = await axios.post(
      'https://accounts.zoho.in/oauth/v2/token',
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      },
    );
  
    return response.data.access_token;
  }
  
  // Create Zoho Customer and Invoice
  // This function creates a customer and an invoice in Zoho Books using the provided payment details and access token.
  async createZohoCustomerAndInvoice(payment: Payment, accessToken: string) {
    const student = payment.auth;
  
    // Step 1: Check if the customer already exists in Zoho Books
    let contactId: string;
    try {
      const searchCustomerRes = await axios.get(
        `${process.env.ZOHO_API_BASE}/contacts?organization_id=${process.env.ZOHO_ORG_ID}&email=${payment.auth.email}`,
        {
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        },
      );
  
      if (searchCustomerRes.data.contacts.length > 0) {
        // Customer exists, retrieve the contact_id
        contactId = searchCustomerRes.data.contacts[0].contact_id;
        console.log('Existing Customer Found:', searchCustomerRes.data.contacts[0]);
      } else {
        console.log('Customer does not exist. Creating a new customer.');
  
        // Step 2: Create a new customer in Zoho Books
        const customerPayload = {
          contact_name: student.name,
          contact_phoneNumber: student.phoneNumber,
          contact_amount: payment.total,
          contact_amount_paid: payment.total,
          contact_amount_due: 0,
          contact_email: payment.auth.email,
          contact_gst_treatment: 'GST',
          contact_type: 'customer',
          email: payment.auth.email,
          phone: payment.auth.phoneNumber,
          contact_currency_code: payment.currency,
          contact_persons: [
            {
              first_name: student.name.trim().split(' ')[0],
              last_name: student.name.trim().split(' ')[1] || '',
              email: payment.auth.email,
              phone: payment.auth.phoneNumber,
            },
          ],
          billing_address: {
            country: payment.auth.student?.country || 'N/A',
          },
        };
  
        const customerRes = await axios.post(
          `${process.env.ZOHO_API_BASE}/contacts?organization_id=${process.env.ZOHO_ORG_ID}`,
          customerPayload,
          {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
          },
        );
  
        console.log('Zoho Customer Created:', customerRes.data);
        contactId = customerRes.data.contact.contact_id;
      }
    } catch (err) {
      console.error('Error checking or creating customer in Zoho Books:', err?.response?.data || err.message);
      throw new Error('Failed to check or create customer in Zoho Books');
    }
  
    // Step 3: Create Invoice in Zoho Books
    try {
      const invoicePayload = {
        customer_id: contactId,
        line_items: [
          {
            name: payment.course.courseName,
            rate: payment.total,
            quantity: 1,
          },
        ],
      };
  
      const invoiceRes = await axios.post(
        `${process.env.ZOHO_API_BASE}/invoices?organization_id=${process.env.ZOHO_ORG_ID}`,
        invoicePayload,
        {
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        },
      );
  
      console.log('Zoho Invoice Created:', invoiceRes.data);
      const invoiceId = invoiceRes.data.invoice.invoice_id;
      console.log('Invoice ID:', invoiceId);
  
      // Step 4: Send Invoice via Email
      await this.emailInvoiceViaZoho(invoiceId, accessToken, payment.auth.email);
      console.log('Invoice emailed by Zoho:', invoiceId);
    } catch (err) {
      console.error('Error creating invoice in Zoho Books:', err?.response?.data || err.message);
      throw new Error('Failed to create invoice in Zoho Books');
    }
  }

  // Helper function: Send invoice via Zoho's built-in email feature
  async emailInvoiceViaZoho(invoiceId: string, accessToken: string, toEmail: string) {
    const payload = {
      to_mail_ids: [toEmail],
      subject: 'Your Invoice from SnowLabs Technology',
      body: 'Thank you for your payment. Please find your invoice attached.',
    };

  const response = await axios.post(
    `${process.env.ZOHO_API_BASE}/invoices/${invoiceId}/email?organization_id=${process.env.ZOHO_ORG_ID}`,
    payload,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

    console.log('Invoice emailed by Zoho:', response.data);
  }

  

  async redeemReferral(referral: Referral): Promise<Referral> {
    console.log(referral);
    if (
      referral.rewardCouponStatus === RewardCouponStatus.TOBEREDEEMED &&
      referral.referralCouponStatus === ReferralCouponStatus.ACTIVE
    )
      referral.rewardCouponStatus = RewardCouponStatus.REDEEMED;

    referral.referralCouponStatus = ReferralCouponStatus.ACTIVE;
    if (referral.rewardCouponStatus !== RewardCouponStatus.REDEEMED)
      referral.validTill = moment(referral.validTill).add(1, 'month').toDate();

    return await this.referralRepo.save(referral);
  }

  async redeemOffer(
    offer: Offers,
    auth: AuthEntity,
    course: Course,
  ): Promise<OfferRedeemed> {
    const redeem = new OfferRedeemed();
    redeem.offer = offer;
    redeem.course = course;
    redeem.student = await this.studentRepo.findOne({
      where: { auth: { id: auth.id } },
    });
    return await this.offerReedeemRepo.save(redeem);
  }
}
