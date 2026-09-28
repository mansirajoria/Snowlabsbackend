import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { StudentQuery } from './dto/query-student.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import { RoleType, enrollmentType } from '@utils/enum';
import { MailService } from '@mail/mail.service';
import { generatePassword, hashPassword } from '@utils/helper.service';
import { FacebookDTO } from '@students/dto/create-facebook-auth.dto';
import HttpException from '@utils/exceptions/HttpException';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { generateStudentSequence } from '@utils/sequence-generator/sequence.service';
import { BatchService } from '@batch/batch.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    private readonly batchService: BatchService,
    private mailService: MailService,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<Student | Enrollment> {
    const alreadyExists = await this.authRepo.findOne({
      where: { email: createStudentDto.email, role: RoleType.STUDENT },
    });
    if (alreadyExists) {
      if (createStudentDto.batchId) {
        const student = await this.studentRepo.findOne({
          where: { auth: { id: alreadyExists.id } },
        });
        const enrollment = await this.batchService.enrollStudent({
          batchId: createStudentDto.batchId,
          studentId: student.id,
        });
        return enrollment;
      } else {
        const phoneExists = await this.authRepo.findOne({
          where: { phoneNumber: createStudentDto.phoneNumber },
        });
        if (phoneExists)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'User phonenumber already exists',
          );
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'User email already exists',
        );
      }
    }

    const auth = new AuthEntity();

    auth.email = createStudentDto.email;
    auth.name = createStudentDto.name;
    const newPass = generatePassword();
    auth.password = await hashPassword(newPass);
    auth.isActive = createStudentDto.isActive;
    auth.phoneNumber = createStudentDto.phoneNumber;
    auth.role = RoleType.STUDENT;
    auth.timeZone = createStudentDto.timeZone;

    const student = new Student();
    student.auth = auth;
    student.studentId = generateStudentSequence();
    student.country = createStudentDto.country;
    student.countryShortCode = createStudentDto.countryShortCode;
    student.countryFlag = createStudentDto.countryFlag;

    await this.authRepo.save(auth);

    if (createStudentDto.isActive)
      await this.mailService.sendLoginCred(
        { to: createStudentDto.email, subject: 'Login credentials' },
        { email: createStudentDto.email, password: newPass },
      );

    const savedStudent = await this.studentRepo.save(student);

    if (createStudentDto.batchId) {
      const enrollment = await this.batchService.enrollStudent({
        batchId: createStudentDto.batchId,
        studentId: savedStudent.id,
      });
      return enrollment;
    }
    return savedStudent;
  }

  async generateCert() {
    // return await this.PDFService.generate()
  }

  async sendEmailToUser(id: string) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['auth'],
    });
    if (!student) throw new HttpException(400, 'Student does not exist');
    const generateNewPassword = generatePassword();
    student.auth.password = await hashPassword(generateNewPassword);
    await this.authRepo.save(student.auth);

    await this.mailService.sendLoginCred(
      {
        to: student.auth.email,
        subject: 'Accounts credentials',
      },
      {
        email: student.auth.email,
        password: generateNewPassword,
      },
    );
  }

  async findAll(query: StudentQuery) {
    const limit = query.pageLength < 1 ? 1 : query.pageLength || 10;
    const page = query.pageNo < 1 ? 1 : query.pageNo || 1;

    const {
      name,
      email,
      isActive,
      phoneNumber,
      country,
      studentId,
      keyword,
      enrollmentStatus,
    } = query;

    const [students, currentCount] = await this.studentRepo
      .createQueryBuilder('qb')
      .innerJoinAndSelect('qb.auth', 'qba')
      .select([
        'qb.id',
        'qb.enrollmentType',
        'qb.studentId',
        'qb.country',
        'qb.countryShortCode',
        'qb.lastModifiedDate',
        'qb.countryFlag',
        'qba.phoneNumber',
        'qba.id',
        'qba.name',
        'qba.email',
        'qba.isActive',
      ])
      .where(
        keyword
          ? 'qba.name ILIKE :name OR qba.email ILIKE :name OR qb.studentId ILIKE :name'
          : name
          ? 'qba.name ILIKE :name'
          : '1=1',
        { name: `%${keyword || name}%` },
      )
      .andWhere(enrollmentStatus ? 'qb.enrollmentType = :enrollment' : '1=1', {
        enrollment: enrollmentStatus,
      })
      .andWhere(phoneNumber ? 'qba.phoneNumber LIKE :phone' : '1=1', {
        phone: phoneNumber,
      })
      .andWhere(country ? 'qb.country ILIKE :country' : '1=1', {
        country: `%${country}%`,
      })
      .andWhere(studentId ? 'qb.studentId ILIKE :studentId' : '1=1', {
        studentId: `%${studentId}%`,
      })
      .andWhere(email ? 'qba.email ILIKE :email' : '1=1', {
        email: `%${email}%`,
      })
      .andWhere(isActive ? 'qba.isActive = :isActive' : '1=1', {
        isActive: isActive === 'true',
      })
      .orderBy('qb.lastModifiedDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalCount = this.studentRepo.count();

    const inActiveCount = this.authRepo
      .createQueryBuilder('auth')
      .where('auth.isActive=false AND role = :student', {
        student: RoleType.STUDENT,
      })
      .getCount();

    const activeCount = this.authRepo
      .createQueryBuilder('auth')
      .where('auth.isActive=true AND role = :student', {
        student: RoleType.STUDENT,
      })
      .getCount();

    const topStudentByCountry = this.studentRepo.query(`
    select s."countryShortCode", s.country,c.alpha_3,  count(s."countryShortCode") as count
    from student s 
    join country c on s."countryShortCode" = c.alpha_2 
    where s."countryShortCode" is not null and s."deletedAt" is null
    group by s."countryShortCode", s.country, c.alpha_3 
    order by count desc 
    limit 3`);

    const [inActive, active, total, topCounty] = await Promise.all([
      inActiveCount,
      activeCount,
      totalCount,
      topStudentByCountry,
    ]);
    return {
      data: students,
      inActiveCount: inActive,
      activeCount: active,
      totalCount: total,
      currentCount,
      topCountyCount: topCounty,
    };
  }

  async findOne(id: string) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['auth'],
      select: {
        id: true,
        studentId: true,
        country: true,
        countryFlag: true,
        countryShortCode: true,
        auth: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          isActive: true,
          timeZone: true,
        },
      },
    });
    if (!student)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Student not found');

    const findCourseEnrolledList = await this.enrollmentRepo.find({
      where: { student: { id: id } },
      relations: {
        batch: {
          course: true,
        },
      },
    });

    return {
      generalDetails: student,
      enrolledCourses: findCourseEnrolledList ? findCourseEnrolledList : [],
    };
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['auth'],
    });
    if (!student)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid student id');

    student.country = updateStudentDto.country;
    student.countryShortCode = updateStudentDto.countryShortCode;
    student.auth.name = updateStudentDto.name;
    student.auth.isActive = updateStudentDto.isActive;

    // if (
    //   ///student.enrollmentType == enrollmentType.ENROLLED &&
    //   updateStudentDto.isActive == false
    // ) {
    //   throw new HttpException(
    //     HttpStatus.BAD_REQUEST,
    //     'Student is already enrolled',
    //   );
    // }
    student.auth.phoneNumber = updateStudentDto.phoneNumber;
    student.auth.email = updateStudentDto.email;
    student.auth.timeZone = updateStudentDto.timeZone;
    // student.countryFlag = updateStudentDto.countryFlag;

    await this.authRepo.save(student.auth);
    await this.studentRepo.save(student);
    return;
  }

  async makeActive(id: string) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['auth'],
    });
    if (!student)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid student id');
    student.auth.isActive = true;
    await this.authRepo.save(student.auth);
    return;
  }

  async makeInactive(id: string) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['auth'],
    });
    if (!student)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid student id');
    student.auth.isActive = false;
    await this.authRepo.save(student.auth);
    return;
  }

  async remove(id: string) {
    const student = await this.studentRepo.findOne({
      relations: ['auth'],
      where: { id },
    });
    if (!student)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid student id');
    const enrollDetails = await this.enrollmentRepo.find({
      where: { student: { id } },
    });
    if (enrollDetails.length)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'you can not delete the enroll student',
      );
    await this.studentRepo.softDelete({ id });
    await this.authRepo.softDelete({ id: student.auth.id });
    return;
  }

  async googleAuthRegister(user: any): Promise<Student> {
    const exists = await this.authRepo.findOne({
      where: { email: user.email },
    });
    if (!exists) {
      const newUser = new AuthEntity();

      newUser.email = user.email;
      newUser.name = user.firstName + ' ' + user.lastName;
      newUser.role = RoleType.STUDENT;
      newUser.isActive = true;

      await this.authRepo.save(newUser);
      const student = new Student();
      student.auth = newUser;
      const studentUser = await this.studentRepo.save(student);
      return studentUser;
    }
  }

  async facebookAuth(user: FacebookDTO): Promise<string> {
    const exists = await this.authRepo.findOne({
      where: { email: user.user.email },
    });
    if (!exists) {
      const newUser = new AuthEntity();
      newUser.email = user.user.email;
      newUser.name = user.user.firstName + ' ' + user.user.lastName;
      const savedUser = await this.authRepo.save(newUser);

      const newStudent = new Student();
      newStudent.auth = savedUser;
      await this.studentRepo.save(newStudent);
      return user.accessToken;
    }
    return user.accessToken;
  }
}
