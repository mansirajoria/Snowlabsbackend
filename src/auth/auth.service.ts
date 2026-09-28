import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FindOneOptions, Not, Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import {
  CreateAuthDto,
  LoginCredsDto,
  UpdateSubAdminDto,
  ConfirmAccount,
  LoginDto,
  SearchQueryDto,
  RegisterDto,
  SlugFilterDto,
} from '@auth/dto/common.dto';
import { In } from 'typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { RoleType, SlugFilter } from '@utils/enum';
import HttpException from '@utils/exceptions/HttpException';
import { MicrosoftTeamService } from 'microsoft-team/microsoft-team.service';
import { Level } from '@access/level/entites/level.entity';
import { Student } from '@students/entities/student.entity';
import * as moment from 'moment';
import { MailService } from '@mail/mail.service';
import { hashPassword, generatePassword } from '@utils/helper.service';
import { generateStudentSequence } from '@utils/sequence-generator/sequence.service';
import { LevelPermission } from '@access/level/entites/level-permission.entity';
import { Course } from '@courses/entities/course.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { Blog } from '@blogs/entities/blog.entity';
import { SlugCheckerRes } from './inetrfaces/slug.interface';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { CheckUserDTO } from './dto/check-user.dto';
import { WebinarEnrollment } from '@webinars/entities/webinar-enrollments.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly microsoftTeamService: MicrosoftTeamService,
    private readonly mailService: MailService,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(SubAdmin) private subAdminRepo: Repository<SubAdmin>,
    @InjectRepository(Level) private levelRepo: Repository<Level>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Webinar) private webinarRepo: Repository<Webinar>,
    @InjectRepository(WebinarEnrollment)
    private webinarEnrollmentRepo: Repository<WebinarEnrollment>,
    @InjectRepository(CourseCategory)
    private courseCategoryRepo: Repository<CourseCategory>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
  ) {}

  async findByFields(
    options: FindOneOptions<AuthEntity>,
  ): Promise<AuthEntity | undefined> {
    return await this.authRepo.findOne(options);
  }

  async testFunc() {
    return true;
  }

  async findUserWithPermissions(id: string): Promise<AuthEntity | undefined> {
    return await this.authRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id })
      .innerJoinAndMapOne('qb.subAdmin', SubAdmin, 'qbs', 'qbs.authId = qb.id')
      .innerJoinAndSelect('qbs.level', 'qbsl')
      .innerJoinAndSelect('qbsl.levelPermission', 'lp')
      .innerJoinAndSelect('lp.module', 'lpm')
      .getOne();
  }

  async findByMail(email: string): Promise<AuthEntity | undefined> {
    return await this.authRepo.findOne({
      where: { email },
      select: ['email', 'password', 'id'],
    });
  }

  /*
   *  Sub Admin CRUD
   */

  async creatSubAdmin(req: CreateAuthDto) {
    const checkUser = await this.authRepo.findOne({
      where: [
        {
          email: req.email.toLowerCase(),
        },
        { phoneNumber: req.phoneNumber },
      ],
    });
    if (checkUser)
      throw new HttpException(409, `Email or Phone already registered !!`);

    const auth = new AuthEntity();

    auth.name = req.name;
    auth.phoneNumber = req.phoneNumber;
    auth.email = req.email.toLowerCase();
    auth.role = RoleType.SUB_ADMIN;
    auth.isActive = req.isActive;

    const generateNewPassword = generatePassword();
    auth.password = await hashPassword(generateNewPassword);
    await this.authRepo.save(auth);

    const findLevel = await this.levelRepo.findOne({
      where: { id: req.level },
    });

    const subadmin = new SubAdmin();

    subadmin.level = findLevel;
    subadmin.auth = auth;

    /*
     * Send Email confirmation for account activation via Mail Server
     */

    if (req.isActive) {
      // const token = Buffer.from(
      //   JSON.stringify({
      //     ...auth,
      //     expirationTime: moment().utcOffset('+01:00').add(1, 'day').format(),
      //   }),
      // ).toString('base64');

      await this.mailService.sendLoginCred(
        {
          to: req.email,
          subject: 'Accounts credentials',
        },
        {
          email: req.email,
          password: generateNewPassword,
        },
      );
    }

    return await this.subAdminRepo.save(subadmin);
  }

  async findAllSubAdmin(searchQuery: SearchQueryDto) {
    const limit = searchQuery.pageLength < 1 ? 1 : searchQuery.pageLength || 10;
    const page = searchQuery.pageNo < 1 ? 1 : searchQuery.pageNo || 1;
    let resp: SubAdmin[];
    if (searchQuery.name) {
      resp = await this.subAdminRepo.find({
        relations: ['auth', 'level'],
        where: {
          auth: {
            role: RoleType.SUB_ADMIN,
            name: Raw(
              (name) =>
                `LOWER(${name}) Like '%${searchQuery.name.toLowerCase()}%'`,
            ),
          },
          // name: Like(`%${searchQuery.name.toLowerCase()}%`),
        },
        skip: (page - 1) * limit,
        take: limit,
        order: {
          auth: {
            name: 'ASC',
          },
        },
      });
    } else {
      resp = await this.subAdminRepo.find({
        relations: ['auth', 'level'],
        where: {
          auth: {
            role: RoleType.SUB_ADMIN,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        order: {
          auth: {
            name: 'ASC',
          },
        },
      });
    }

    const totalSubAdminCount = await this.authRepo.count({
      where: { role: RoleType.SUB_ADMIN },
    });

    const activeSubAdminCount = await this.authRepo.count({
      where: { role: RoleType.SUB_ADMIN, isActive: true },
    });

    const totalLevelCount = await this.levelRepo.count();

    return {
      data: resp,
      stats: {
        totalSubAdminCount,
        activeSubAdminCount,
        totalLevelCount,
      },
    };
  }

  async findOneSubadmin(id: string) {
    const findSubAdmin = await this.subAdminRepo.findOne({
      where: { id },
      relations: { auth: true, level: true },
    });
    if (!findSubAdmin) throw new HttpException(404, 'No Sub-admin Found');
    return findSubAdmin;
  }

  async deactivateSubAdmin(id: string) {
    const findSubAdmin: SubAdmin = await this.subAdminRepo.findOne({
      where: { id: id },
      relations: ['auth'],
    });

    const findAuth = await this.authRepo
      .createQueryBuilder('qb')
      .where('id = :id', { id: findSubAdmin.auth.id })
      .getOne();

    findAuth.isActive = false;

    return this.authRepo.save(findAuth);
  }

  async changeStatus(id: string) {
    const findSubAdmin: SubAdmin = await this.subAdminRepo.findOne({
      where: { id: id },
      relations: ['auth'],
    });

    const findAuth = await this.authRepo
      .createQueryBuilder('qb')
      .where('id = :id', { id: findSubAdmin.auth.id })
      .getOne();

    let setValue: boolean;

    if (findAuth.isActive == true) {
      setValue = false;
    }
    if (findAuth.isActive == false) {
      setValue = true;
    }

    findAuth.isActive = setValue;

    return this.authRepo.save(findAuth);
  }

  async activateSubAdmin(id: string) {
    const findSubAdmin: SubAdmin = await this.subAdminRepo.findOne({
      where: { id: id },
      relations: ['auth'],
    });

    const findAuth = await this.authRepo
      .createQueryBuilder('qb')
      .where('id = :id', { id: findSubAdmin.auth.id })
      .getOne();

    findAuth.isActive = true;

    return this.authRepo.save(findAuth);
  }

  async updateSubAdmin(id: string, req: UpdateSubAdminDto) {
    const findSubAdmin = await this.subAdminRepo.findOne({
      where: { id: id },
      relations: ['auth'],
    });
    if (!findSubAdmin) throw new HttpException(404, `Subadmin not found!!`);

    const findAuth = await this.authRepo.findOne({
      where: { id: findSubAdmin.auth.id },
    });

    // Email check
    if (req.email) {
      const emailCheck = await this.authRepo.findOne({
        where: { email: req.email.toLowerCase(), role: RoleType.SUB_ADMIN },
      });

      if (emailCheck)
        throw new HttpException(400, `Subadmin with Email already exists!!`);
      findAuth.email = req.email.toLowerCase();
    }
    const findLevel = await this.levelRepo.findOne({
      where: { id: req.level },
    });

    if (!findLevel) throw new HttpException(404, `Level Not Found !!`);

    findAuth.name = req.name;
    findAuth.phoneNumber = req.phoneNumber;
    findAuth.isActive = req.isActive;

    findSubAdmin.level = findLevel;

    const subadminUpdated = await this.subAdminRepo.save(findSubAdmin);
    const authUpdated = await this.authRepo.save(findAuth);
    subadminUpdated.auth = authUpdated;
    return subadminUpdated;
  }

  async softDeleteSubAdmin(id: string) {
    const findSubAdmin = await this.subAdminRepo.findOne({
      where: { id },
      relations: ['auth'],
    });
    if (!findSubAdmin) throw new HttpException(404, 'No Sub-admin Found');

    const findAuth = await this.authRepo
      .createQueryBuilder('qb')
      .where('id = :id', { id: findSubAdmin.auth.id })
      .getOne();

    await this.authRepo.softDelete(findAuth.id);
    await this.subAdminRepo.softDelete(id);
  }

  async sendLoginCredentials(req: LoginCredsDto) {
    const checkUser = await this.findByMail(req.email.toLowerCase());
    if (!checkUser) throw new HttpException(404, `User not found !!`);
    const generateNewPassword = generatePassword();
    // const generateNewPassword = 'password';

    await this.mailService.sendViaSendGrid({
      to: req.email,
      subject: 'Website Access Details & Login Credentials',
      text: `
<p>Dear,</p>

<p>Please find below the access details for the SnowLabs Technology website:</p>

<table style="border-collapse: collapse; width: 60%; margin-bottom: 20px;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Website URL:</td>
    <td style="padding: 8px; border: 1px solid #ddd;"><a href="https://www.snowlabstechnology.com/">https://www.snowlabstechnology.com/</a></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email ID:</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${req.email}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Password:</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${generateNewPassword}</td>
  </tr>
</table>

<p>Kindly keep the above credentials confidential and use them strictly for authorized purposes only.</p>

<p>If you face any issues accessing the website or require further assistance, please feel free to reach out to us at <a href="tel:+919717594443">+91-9717594443</a>.</p>

<p>We look forward to your confirmation once access is successfully verified.</p>

<p>Warm regards,<br/>
Team SnowLabs Technology</p>
`
,
    });

    checkUser.password = await hashPassword(generateNewPassword);

    await this.authRepo.save(checkUser);
  }

  /*
    Website
  */

  async signup(req: RegisterDto, timezone?: string) {
    await this.checkUser({ email: req.email, phoneNumber: req.phoneNumber });

    const tempUser = await this.authRepo.findOne({
      where: { email: req.email, password: null },
    });
    if (tempUser) {
      await this.webinarEnrollmentRepo.delete({ auth: { id: tempUser.id } });
      await this.authRepo.delete({ id: tempUser.id });
    }

    const auth = new AuthEntity();

    auth.email = req.email.toLowerCase();
    auth.phoneNumber = req.phoneNumber;
    auth.password = await hashPassword(req.password);
    auth.role = RoleType.STUDENT;
    auth.isActive = true;
    auth.countryCode = req.countryCode;
    if (timezone) auth.timeZone = timezone;

    const authCreated = await this.authRepo.save(auth);

    const student = new Student();
    student.studentId = generateStudentSequence();

    student.auth = authCreated;
    student.country = req.country;
    student.countryFlag = req.countryFlag;
    student.countryShortCode = req.countryShortCode;

    await this.studentRepo.save(student);

    // Send Welcome Mail
    this.mailService.sendViaSendGrid({
      to: req.email.toLowerCase(),
      subject: 'Welcome Mail',
      text: `
          <p>Dear, </p>
          <p>Welcome to our SnowLabs Technology Website - We are excited to have you join our community of learners!</p>
          <p>Your account has been successfully registered. You are now one step closer to enhancing your skills and knowledge.</p>
          <p>Here is what you can expect from us:</p>
          <ol>
              <li>Access to a range of high-quality training courses information.</li>
              <li>Access to our learning resources – Blogs, webinars, Set-up Guides.</li>
              <li>Career counseling and recommendations based on your interests and goals.</li>
              <li>Monthly newsletter to help you stay on top of your learning journey.</li>
              <li>Be the first to know about the launch of new courses, webinars, and discount offers.</li>
          </ol>
          <p>Thank you for choosing SnowLabs for your learning needs. We are looking forward to helping you achieve your goals and grow your skills.</p>
          <p>If you have any questions or need any information, please reach out to us at <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a></p>
          <p>Phone: +91-7428334555</p>
          <p>Whatsapp: <a href="https://wa.link/8v0eqa">https://wa.link/8v0eqa</a></p>
          <p>All the best!</p>
          <p>Team - SnowLabs Technology</p>
      `,
    });

    const resp = await this.authRepo.findOne({
      where: { email: req.email.toLowerCase(), role: RoleType.STUDENT },
    });

    this.appendOriginalPhone(resp);

    const jwtObject = {
      id: resp.id,
      role: RoleType.STUDENT,
    };
    const token: string = this.jwtService.sign(jwtObject);

    return { token, resp };
  }

  async authInfo(id: string): Promise<AuthEntity> {
    let resp: AuthEntity = await this.authRepo.findOne({ where: { id } });
    if (!resp) throw new HttpException(404, `User not found !!`);

    if (resp.role === RoleType.SUB_ADMIN) {
      resp = await this.authRepo
        .createQueryBuilder('auth')
        .where('auth.id = :id', { id })
        .andWhere('auth.role = :role1', { role1: RoleType.SUB_ADMIN })
        .innerJoinAndMapOne(
          'auth.subAdmin',
          SubAdmin,
          'subadmin',
          'auth.id = subadmin.authId',
        )
        .innerJoinAndSelect('subadmin.level', 'level')
        .innerJoinAndSelect('level.levelPermission', 'lp')
        .innerJoinAndSelect('lp.module', 'module')
        .getOne();
    }
    return resp;
  }

  async login(req: LoginDto) {
    const userEmail = req.email;
    const userPassword = req.password;

    const findUser = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.role = :role', { role: RoleType.STUDENT })
      .andWhere('auth.email = :email', { email: userEmail.toLowerCase() })
      .andWhere('auth.password IS NOT NULL')
      .getOne();

    if (!findUser) throw new HttpException(404, `User not found!!`);

    const isPasswordMatching: boolean = await bcrypt.compare(
      userPassword,
      findUser.password,
    );
    findUser.isLogIn = true;
    await this.authRepo.save(findUser);

    if (!isPasswordMatching)
      throw new HttpException(400, 'Incorrect email or password');

    if (!findUser.isActive)
      throw new HttpException(400, 'Your account is disabled');

    const jwtObject = {
      id: findUser.id,
      role: findUser.role,
    };
    const token: string = this.jwtService.sign(jwtObject);

    const resp = await this.authRepo
      .createQueryBuilder('qb')
      .where('qb.email = :email', { email: userEmail.toLowerCase() })
      .andWhere('qb.role = :role1', { role1: RoleType.STUDENT })
      .innerJoinAndMapOne('qb.student', Student, 'qbs', 'qbs.authId = qb.id')
      .getOne();

    this.appendOriginalPhone(resp);

    return { token, resp };
  }

  async forgotPassword(email: string): Promise<string> {
    const findUser = await this.authRepo.findOne({
      where: [{ email: email.toLowerCase() }],
    });

    if (!findUser) throw new HttpException(404, `User not found !!`);

    const generateNewPassword = generatePassword();
    findUser.password = await hashPassword(generateNewPassword);
    await this.authRepo.save(findUser);
    await this.mailService.sendLoginCred(
      {
        to: findUser.email,
        subject: 'New Login Credentials',
      },
      {
        email: findUser.email,
        password: generateNewPassword,
      },
    );

    return 'New login credentials sent on mail successfully';
  }

  /*
   * Admin Login
   */

  async adminLogin(loginDto: LoginDto) {
    const userEmail = loginDto.email;
    const userPassword = loginDto.password;
    let findUser: AuthEntity = await this.authRepo.findOne({
      where: [
        { email: userEmail.toLowerCase(), role: RoleType.ADMIN },
        { email: userEmail.toLowerCase(), role: RoleType.SUB_ADMIN },
      ],
    });

    if (!findUser) throw new HttpException(404, `User not found !!`);

    const isPasswordMatching: boolean = await bcrypt.compare(
      userPassword,
      findUser.password,
    );

    if (!isPasswordMatching)
      throw new HttpException(400, 'Incorrect email or password');

    if (!findUser.isActive)
      throw new HttpException(400, 'Your account is disabled');
    findUser.isLogIn = true;
    await this.authRepo.save(findUser);
    const jwtObject = {
      id: findUser.id,
      role: findUser.role,
    };
    const token: string = this.jwtService.sign(jwtObject);

    if (findUser.role === RoleType.SUB_ADMIN) {
      // * * Its a reverse relation * *
      findUser = await this.authRepo
        .createQueryBuilder('auth')
        .where('auth.email = :email', { email: userEmail })
        .andWhere('auth.role = :role1', { role1: RoleType.SUB_ADMIN })
        // innerJoinAndMapOne Works when you starting reverse relation : OneToMany Side
        .innerJoinAndMapOne(
          'auth.subAdmin',
          SubAdmin,
          'subadmin',
          'auth.id = subadmin.authId',
        )
        .innerJoinAndSelect('subadmin.level', 'level')
        // innerJoinAndMapMany : we need to MapMany to get all the module under that level
        // .innerJoinAndMapMany(
        //   'level.levelPermission',
        //   LevelPermission,
        //   'lp',
        //   'level.id = lp.levelId',
        // )
        .innerJoinAndSelect('level.levelPermission', 'lp')
        .innerJoinAndSelect('lp.module', 'module')
        .getOne();
    }

    return { token, user: findUser };
  }

  async findAllAdmin() {
    const users = await this.authRepo.find({
      where: { role: RoleType.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        role: true,
      },
    });
    return users;
  }

  /* Forgot Password Flow

  async forgotPasswordInit(email: string): Promise<string> {
    const findUser = await this.authRepo.findOne({
      where: [
        { email: email, role: RoleType.ADMIN },
        { email: email, role: RoleType.SUB_ADMIN },
      ],
    });

    if (!findUser) throw new HttpException(404, `User not found !!`);

    const token = Buffer.from(
      JSON.stringify({
        ...findUser,
        expirationTime: moment().utcOffset('+01:00').add(1, 'day').format(),
      }),
    ).toString('base64');

    const mailpayload: MailDto = {
      to: findUser.email,
      subject: 'Reset Password',
    };

    await this.mailService.forgotPasswordMail(mailpayload, token);

    return 'Forgot password mail sent successfully';
  }

  async forgotPasswordSuccess(req: ResetPasswordDto) {
    const tokenExpired =
      moment(
        JSON.parse(Buffer.from('token', 'base64').toString()).expirationTime,
      ) <= moment();
    if (tokenExpired) throw new HttpException(422, `Token Expired !!!`);

    if (req.password.length < 5)
      throw new HttpException(422, `Password Must be 8 character long!!`);

    const decodeToken = JSON.parse(Buffer.from(req.token, 'base64').toString());

    const userEmail = decodeToken.email;
    const findUser = await this.authRepo.findOne({
      where: [
        { email: userEmail, role: RoleType.ADMIN },
        { email: userEmail, role: RoleType.SUB_ADMIN },
      ],
    });
    findUser.password = await hashPassword(req.password);

    await this.authRepo.save(findUser);
    return 'Password reset successfully';
  }

  */

  async forgotPasswordAdmin(email: string): Promise<string> {
    const findUser = await this.authRepo.findOne({
      where: {
        email: email.toLowerCase(),
        role: In([RoleType.ADMIN, RoleType.SUB_ADMIN]),
      },
    });

    if (!findUser) throw new HttpException(404, `User not found !!`);

    const generateNewPassword = generatePassword();
    findUser.password = await hashPassword(generateNewPassword);
    await this.authRepo.save(findUser);
    await this.mailService.sendLoginCred(
      {
        to: findUser.email,
        subject: 'New Login Credentials',
      },
      {
        email: findUser.email,
        password: generateNewPassword,
      },
    );

    return 'New login credentials sent on mail successfully';
  }

  async teamCallBack(code: string): Promise<string> {
    const token = await this.microsoftTeamService.authToken(code);
    const { email } = await this.microsoftTeamService.profile(
      token?.access_token,
    );
    const findUser = await this.authRepo.findOne({
      where: [
        {
          email: email.toLowerCase(),
          role: RoleType.ADMIN,
        },
        {
          email: email.toLowerCase(),
          role: RoleType.SUB_ADMIN,
        },
      ],
    });
    if (!findUser)
      throw new HttpException(400, `Incorrect email or password !!`);
    if (!findUser.isActive)
      throw new HttpException(400, 'Your account is disabled');
    const jwtObject = {
      id: findUser.id,
      role: findUser.role,
    };
    findUser.outLookToken = token.access_token;
    findUser.outLookRefreshToken = token.refresh_token;
    await this.authRepo.save(findUser);
    const jwtToken: string = this.jwtService.sign(jwtObject, {
      secret: process.env.AUTH_JWT_SECRET,
      expiresIn: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
    });
    return jwtToken;
  }

  async linkedInAuthRegister(user: any): Promise<any> {
    const exists = await this.authRepo.findOne({
      where: { email: user.email },
    });
    if (!exists) {
      const newUser = new AuthEntity();
      newUser.email = user.email;
      newUser.name = user.fullName;
      newUser.role = RoleType.STUDENT;
      newUser.isActive = true;
      await this.authRepo.save(newUser);
      const student = new Student();
      student.auth = newUser;
      const studentUser = await this.studentRepo.save(student);
      return studentUser;
    }
  }

  async confirmAccount(token: string, req: ConfirmAccount) {
    const checkUser = await this.findByMail(req.email);
    if (!checkUser) throw new HttpException(404, `User not found !!`);

    if (req.password.length < 5)
      throw new HttpException(422, `Password Must be 8 character long!!`);

    // Front end to implement the decode Token check before sumbit button
    const tokenExpired =
      moment(
        JSON.parse(Buffer.from(token, 'base64').toString()).expirationTime,
      ) <= moment();
    if (tokenExpired)
      throw new HttpException(422, `Invitation Token Expired !!!`);

    checkUser.password = await hashPassword(req.password);

    await this.authRepo.save(checkUser);
  }

  async logout(authid: string) {
    const userDetails = await this.authRepo.findOne({ where: { id: authid } });
    if (!userDetails) throw new HttpException(404, `User not found !!`);
    userDetails.isLogIn = false;
    await this.authRepo.save(userDetails);
  }

  async slugChecker(paylaod: SlugFilterDto): Promise<SlugCheckerRes> {
    let isSlugAvailable: any;
    if (paylaod.filter === SlugFilter.BLOG) {
      isSlugAvailable = await this.blogRepo.findOne({
        where: { slugName: paylaod.slugName },
      });
    }
    if (paylaod.filter === SlugFilter.COURSE) {
      isSlugAvailable = await this.courseRepo.findOne({
        where: { slugName: paylaod.slugName },
      });
    }
    if (paylaod.filter === SlugFilter.CATEGORY) {
      isSlugAvailable = await this.courseCategoryRepo.findOne({
        where: { slugName: paylaod.slugName },
      });
    }
    if (paylaod.filter === SlugFilter.WEBINAR) {
      isSlugAvailable = await this.webinarRepo.findOne({
        where: { slugName: paylaod.slugName },
      });
    }
    if (isSlugAvailable)
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        `${paylaod.slugName} is already in use`,
      );
    const response: SlugCheckerRes = {
      slugName: paylaod.slugName,
      isAvailable: false,
    };
    return response;
  }

  async slugNames() {
    const blogsPromise = this.blogRepo.find({
      select: { slugName: true, blogType: true },
    });
    const coursePromise = this.courseRepo.find({ select: { slugName: true } });
    const courseCategoryPromise = this.courseCategoryRepo.find({
      select: { slugName: true },
    });
    const webinarPromise = this.webinarRepo.find({
      select: { slugName: true },
    });
    const [blogs, courses, courseCategory, webinar] = await Promise.all([
      blogsPromise,
      coursePromise,
      courseCategoryPromise,
      webinarPromise,
    ]);
    return { blogs, courses, courseCategory, webinar };
  }

  appendOriginalPhone(auth: AuthEntity) {
    const phoneTenDigit = auth.phoneNumber.replace(auth.countryCode, '');
    auth['originalPhoneNo'] = phoneTenDigit;
  }

  async checkUser(payload: CheckUserDTO) {
    const findUser = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.email = :email', { email: payload.email })
      .andWhere('auth.password IS NOT NULL')
      .getOne();

    if (findUser) throw new HttpException(400, `User already exists!!`);

    const findUserWithPhone = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.phoneNumber = :phone', { phone: payload.phoneNumber })
      .andWhere('auth.password IS NOT NULL')
      .getOne();

    if (findUserWithPhone)
      throw new HttpException(400, `PhoneNumber already exists!!`);
    return true;
  }
}
