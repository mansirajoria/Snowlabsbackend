import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Leads } from './entities/leads.entity';
import { CreateLeadDTO } from './dto/create-lead.dto';
import { QueryLeadDTO } from './dto/query-lead.dto';
import HttpException from '@utils/exceptions/HttpException';
import { UpdateLeadDTO } from './dto/update-lead.dto';
import { LeadTrack } from './entities/leads-track.entity';
import { CorporateLead } from './entities/leads-corporate.entity';
import { CorporateTrack } from './entities/leads-corporate-track.entity';
import { CreateCorporateLeadDTO } from './dto/create-corporate-lead.dto';
import {
  FormNameEnum,
  HelpDeskStatus,
  LeadsStatus,
  QueryType,
} from '@utils/enum';
import { UpdateCorporateLeadDTO } from './dto/update-corporate-lead.dto';
import { Trainer } from '@trainer/entities/trainer.entity';
import { LeadsquareService } from 'leadsquare/leadsquare.service';
import { generateQuerySequence } from '@utils/sequence-generator/sequence.service';
import { AxiosError } from 'axios';
import { MailService } from '@mail/mail.service';
import { CreateHelpdeskDTO } from './dto/create-helpdesk.dto';
import { Student } from '@students/entities/student.entity';
import { Helpdesk } from './entities/helpdesk.entity';
import { HelpdeskTrack } from './entities/helpdesk-track.entity';
import { UpdateHelpdeskDTO } from './dto/update-helpdesk.dto';
import { QueryHelpdeskDTO } from './dto/query-helpdesk.dto';
import { QueryCorporateLeadDTO } from './dto/query-corporate-lead.dto';
import { Course } from '@courses/entities/course.entity';
import {
  getBookDemoMailBody,
  getDownloadSyllabusMailBody,
  getWantDetailsMailBody,
} from '@utils/helpers/mailbody.helper';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Leads) private leadsRepo: Repository<Leads>,
    @InjectRepository(LeadTrack) private trackRepo: Repository<LeadTrack>,
    @InjectRepository(Helpdesk)
    private readonly helpdeskRepo: Repository<Helpdesk>,
    @InjectRepository(HelpdeskTrack)
    private readonly helpTrackRepo: Repository<HelpdeskTrack>,

    @InjectRepository(CorporateLead)
    private corporateRepo: Repository<CorporateLead>,

    @InjectRepository(CorporateTrack)
    private corporateTrackRepo: Repository<CorporateTrack>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,

    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    private LeadSQService: LeadsquareService,
    private mailService: MailService,
  ) {}

  /**
   * Creates a new query, either lead or helpdesk entity based on query type
   *
   * @param CreateLeadDTO QueryType
   *
   * @returns Leads
   */
  async createLead(createLeadDto: CreateLeadDTO, queryType: QueryType) {
    //  Creates a new lead from the DTO

    const {
      query,
      email,
      name,
      course,
      category,
      courseId,
      formName,
      pageName,
      countryCode,
      phoneNumber,
      trainingObjective,
      certification,
      message,
    } = createLeadDto;
    const lead = new Leads();
    lead.query = query;
    lead.email = email;
    lead.name = name;
    lead.phoneNumber = phoneNumber;
    lead.countryCode = countryCode;
    lead.category = category;
    lead.queryId = generateQuerySequence();

    if (courseId) {
      const course = await this.courseRepo.findOne({ where: { id: courseId } });
      if (!course)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid course');
      lead.course = course;
    }

    const track = new LeadTrack();
    track.lead = await this.leadsRepo.save(lead);
    const savedTrack = await this.trackRepo.save(track);

    const adminMailBody = `
    <p>Query </p>
    <p>Name: ${name}</p>
    <p>Email: ${email}</p>
    <p>Phone Number: ${countryCode}${phoneNumber}</p>
    <p>Query: ${query}</p>`;

    this.mailService.sendViaSendGrid({
      to: process.env.MAIL_MAIL,
      subject: `Query ID: ${lead.queryId}`,
      text: adminMailBody,
    });

    //  Capture lead if the query type is lead
    if (queryType === QueryType.Lead) {
      try {
        //  Send a welcome mail
        let mailBody;
        let mailSubject = 'Welcome mail';
        if (formName === FormNameEnum.DOWNLOAD_SYLLABUS_FORM) {
          mailBody = getDownloadSyllabusMailBody();
          mailSubject = 'Thank you for downloading our Course Brochure';
        }
        if (
          formName === FormNameEnum.TALK_TO_ADVISOR ||
          formName === FormNameEnum.TALK_TO_US ||
          formName === FormNameEnum.CONNECT_WITH_ADVISOR
        ) {
          mailBody = `
          <p>Dear <strong>${name || 'Learner'}</strong>,</p>
          <p>Thank you for reaching out to us!</p>
          <p>We have received your request to talk to our advisors. We appreciate your interest in seeking guidance and assistance from our team.</p>
          <p>One of our experienced advisors will get in touch with you shortly to discuss your inquiry and provide the assistance you need. We understand that your time is valuable, and we will make every effort to schedule a convenient time for this conversation.</p>
          <p>If you have any urgent queries, please do not hesitate to reach out to us at <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a></p>
          <p><b>Phone</b>: +91-7428334555</p>
          <p><b>Whatsapp</b>: <a href="https://wa.link/8v0eqa">https://wa.link/8v0eqa</a></p>
          <p>Thanks</p>
          <p><b>Team - SnowLabs Technology</b></p>`;

          mailSubject =
            'Inquiry Regarding Advisor Consultation - SnowLabs Technology';
        }

        if (formName === FormNameEnum.CERTIFICATION) {
          mailBody = `
          <p>Dear <strong>${name || 'Learner'}</strong>,</p>
          <p>Thank you for reaching out to us for an enquiry. We appreciate you for choosing us for your Certification needs.</p>
          <p>Our team will get in touch with you shortly to understand your requirements more specifically. Meanwhile, if you would like to share additional details like configuration required, it will help us tailor the requirements better to meet your needs.</p>
          <p>Please do not hesitate to reach out to us on <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a>.</p>
          <p><b>Whatsapp</b>: <a href="https://wa.link/biujvn">https://wa.link/biujvn</a></p>
          <p><b>Phone</b>: +91-7303722557</p>
          <p>Thanks,</p>
          <p><b>Certification Team - SnowLabs Technology!</b></p>
        `;
          mailSubject = 'Your Query for Certification - SnowLabs Technology';
        }

        if (
          formName === FormNameEnum.REQUEST_BATCH &&
          pageName.split('-')[1] !== 'solo'
        ) {
          mailBody = `
          <p>Dear <strong>${name || 'Learner'}</strong>,</p>
          <p>Thank you for your interest and reaching out to us to inquire about the availability of the course schedule.</p>
          <p>Our team of experts will get in touch with you to understand your learning requirements.</p>
          <p>To help us better, please advise if you are interested in the program or inquiring on behalf of your organization.</p>
          <p>You can respond to us at <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a>.</p>
          <p><b>Phone</b>: +91-7428334555</p>
          <p><b>Whatsapp</b>: <a href="https://wa.link/8v0eqa">https://wa.link/8v0eqa</a></p>
          <p>To ensure that you are among the first ones to know about our upcoming courses, please subscribe to our newsletter, stay connected on social media, or alternatively contact our sales team at [sales team contact information].</p>
          <p>Thank you again for considering us for your educational journey. We look forward to the possibility of welcoming you to one of our courses in the future.</p>
          <p>Thanks,</p>
          <p><b>Team - SnowLabs Technology</b></p>
        `;

          mailSubject = 'Your Batch Enquiry';
        }
        if (
          formName === FormNameEnum.REQUEST_BATCH &&
          pageName.split('-')[1] === 'solo'
        ) {
          mailBody = `
          <p>Dear <strong>${name || 'Learner'}</strong>,</p>
          <p>Thank you for expressing your interest in the 1:1 training program. We appreciate your inquiry and are excited about the possibility of working with you on your personal and professional development goals.</p>
          <p>Our expert program manager will connect with you shortly to understand your learning requirements.</p>
          <p>Meanwhile, if you have any questions, do not hesitate to connect with us on <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a></p>
          <p><b>Phone</b>: +91-7428334555</p>
          <p><b>Whatsapp</b>: <a href="https://wa.link/8v0eqa">https://wa.link/8v0eqa</a></p>
          <p>Thanks,</p>
          <p><b>Team - SnowLabs Technology</b></p>
          `;
          mailSubject = 'Your 1:1 Training Query ';
        }

        if (formName === FormNameEnum.WANT_MORE_DETAILS) {
          mailBody = getWantDetailsMailBody();
          mailSubject = 'Course Enquire – SnowLabs Technology ';
        }

        if (formName === FormNameEnum.BOOK_A_DEMO) {
          mailBody = getBookDemoMailBody();
          mailSubject = 'Confirmation of Your Demo Class Request';
        }

        if (mailBody)
          this.mailService.commonMail({
            to: createLeadDto.email,
            subject: mailSubject,
            text: mailBody,
          });

        //  Capture lead with LeadSqaured API
        const response = await this.LeadSQService.captureNewLead({
          firstName: createLeadDto.name?.split(' ')[0],
          lastName: createLeadDto.name
            ?.split(' ')
            .slice(1, name.split(' ').length)
            .join(' '),
          email: createLeadDto.email,
          countryCode: createLeadDto.countryCode,
          phone: createLeadDto.phoneNumber,
          pageName: createLeadDto.pageName,
          formName: createLeadDto.formName,
          course: createLeadDto.course,
          trainingObjective: createLeadDto.trainingObjective,
          certification: createLeadDto.certification,
          message: message,
        });
        console.log(response);
      } catch (err) {
        console.log(err);
        if (err instanceof AxiosError) {
          //  Throw error if the error type is anything other than Duplicate Entry
          if (err.response.data.ExceptionType !== 'MXDuplicateEntryException')
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              err.response.data.ExceptionMessage,
            );
        } else throw err;
      }
    }
    return await this.leadsRepo.save(savedTrack.lead);
  }

  async findOneLead(id: string) {
    const lead = await this.leadsRepo.findOne({
      where: { id },
      relations: ['statusTrack', 'course'],
      order: { statusTrack: { createdAt: 'ASC' } },
    });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    return lead;
  }

  async softDelete(id: string) {
    const lead = await this.leadsRepo.findOne({ where: { id } });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    return await this.leadsRepo.softDelete({ id });
  }

  /**
   * Retrieves leads based on the provided criteria and query type.
   * @async
   * @param {QueryLeadDTO} queryLeadsDto - The query parameters for lead retrieval.
   * @param {QueryType} queryType - The type of query being performed.
   * @returns An object containing lead data and counts.
   */

  async findAllLeads(queryLeadsDto: QueryLeadDTO, queryType: QueryType) {
    // Destructure properties from the query DTO object, providing default values if not present.
    const {
      search,
      limit = 10, // Default limit of leads per page.
      page = 1, // Default page number.
      status, // Lead status.
      queryId, // Identifier for the query.
      category, // Category of leads.
    } = queryLeadsDto;

    // Use Promise.all() to concurrently fetch different sets of lead data.
    const [leads, total, lost, converted, processing] = await Promise.all([
      // Fetch leads from the repository based on specified criteria.
      this.leadsRepo.find({
        where: {
          status,
          query: search && search !== '' ? ILike(`%${search}%`) : undefined, // Match leads with a partial match to search term.
          category, // Match leads with the specified category.
          queryId, // Match leads with the provided query ID.
        },
        take: limit, // Limit the number of leads per page.
        skip: (page - 1) * limit, // Calculate the appropriate offset for pagination.
        order: { createdDate: 'DESC' },
      }),
      // Count the total number of leads in the repository.
      this.leadsRepo.count(),
      // Count the number of leads with the "Lost" status.
      this.leadsRepo.count({
        where: { status: LeadsStatus.LOST },
      }),
      // Count the number of leads with the "Converted" status.
      this.leadsRepo.count({
        where: { status: LeadsStatus.CONVERTED },
      }),
      // Count the number of leads with the "Processing" status.
      this.leadsRepo.count({
        where: { status: LeadsStatus.PROCESSING },
      }),
    ]);

    // Return an object containing the retrieved lead data and various counts.
    return {
      data: leads, // Array of retrieved leads.
      totalCount: total, // Total number of leads in the repository.
      lostCount: lost, // Count of leads with the "Lost" status.
      convertedCount: converted, // Count of leads with the "Converted" status.
      processingCount: processing, // Count of leads with the "Processing" status.
    };
  }

  /**
   * Updates a lead's information and status if provided.
   * @async
   * @param {string} id - The ID of the lead to update.
   * @param {UpdateLeadDTO} updateDto - The data to update the lead with.
   * @returns {Promise<Lead>} The updated lead.
   * @throws {HttpException} If the lead with the provided ID is not found.
   */
  async updateLead(id: string, updateDto: UpdateLeadDTO): Promise<Leads> {
    // Find the lead to be updated using the provided ID.
    const lead = await this.leadsRepo.findOne({ where: { id } });

    // If lead is not found, throw an exception indicating invalid ID.
    if (!lead) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    }

    // Update the lead's properties with the data from the update DTO.
    lead.name = updateDto.name;
    lead.email = updateDto.email;
    lead.phoneNumber = updateDto.phoneNumber;
    lead.query = updateDto.query;
    lead.category = updateDto.category;

    if (updateDto.isOpened && !lead.isOpened) {
      const track = new LeadTrack();
      track.lead = lead;
      lead.isOpened = true;
      track.status = LeadsStatus.PENDING;
      await this.trackRepo.save(track);
    }

    // If an updated status is provided, create a new lead track entry.
    if (updateDto.status) {
      const track = new LeadTrack();
      track.lead = lead;
      lead.status = updateDto.status;
      track.status = updateDto.status;
      track.comments = updateDto.comments;
      await this.trackRepo.save(track);
    }

    // Save the updated lead and return the updated lead object.
    return await this.leadsRepo.save(lead);
  }

  /**
   * Creates a new corporate lead and performs associated tasks.
   * @async
   * @param {CreateCorporateLeadDTO} createCorpoLeadDto - Data for creating a corporate lead.
   * @returns {Promise<void>}
   * @throws {HttpException} If there's an error during lead creation or associated tasks.
   */
  async createCorporateLead(
    createCorpoLeadDto: CreateCorporateLeadDTO,
  ): Promise<void> {
    // Destructure properties from the creation DTO.
    const {
      name,
      email,
      organization,
      contactNo,
      designation,
      countryCode,
      pageName,
      formName,
      message,
    } = createCorpoLeadDto;

    // Create a new corporate lead instance from the DTO data.
    const lead = this.corporateRepo.create(createCorpoLeadDto);
    lead.queryId = generateQuerySequence();

    // Save the newly created lead.
    const savedLead = await this.corporateRepo.save(lead);

    // Create a new corporate track instance and set its properties.
    const track = new CorporateTrack();
    track.lead = savedLead;
    track.status = LeadsStatus.NEW;
    lead.status = LeadsStatus.NEW;

    let mailBody;
    let mailSubject = 'Welcome mail';
    mailBody = `
    <p>Dear Learner,</p>
    <p>Thank you for your email and your interest in booking a lab with us. We appreciate the opportunity to assist you with your lab needs.</p>
    <p>We have received your inquiry, and our team will shortly get in touch with you to discuss this further.</p>
    <p>You can also reach out to us on <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a>.</p>
    <p><b>Whatsapp</b>: <a href="https://wa.link/biujvn">https://wa.link/biujvn</a></p>
    <p><b>Phone</b>: +91-7303722557</p>
    <p>Thanks,</p>
    <p><b>Team - SnowLabs Technology</b></p>
  `;
    if (formName === FormNameEnum.BOOK_A_LAB) {
      mailSubject = 'Your Query for Cloud Lab - SnowLabs Technology';
    }

    if (formName === FormNameEnum.REQUST_FOR_LAB) {
      mailSubject = 'Your Query for Cloud Lab - SnowLabs Technology';
    }

    if (formName === FormNameEnum.INQUIRE_BLOGS) {
      mailSubject = 'Talk to Us - SnowLabs Technology';
    }

    if (
      formName === FormNameEnum.CORPORATE ||
      formName === FormNameEnum.GET_QUOTE ||
      formName === FormNameEnum.CONTACT_US ||
      formName === FormNameEnum.UPSKILL
    ) {
      mailBody = `
      <p>Dear <strong>${name || 'Learner'}</strong>,</p>
      <p>Thank you for reaching out to SnowLabs Technology with your inquiry regarding corporate training services. We appreciate your interest in our offerings.</p>
      <p>We understand the importance of providing tailored and impactful training solutions to meet the specific needs of your organization.</p>
      <p>We would be delighted to discuss your specific requirements in more detail and provide you with a customized proposal that outlines the training program's scope, objectives, and pricing.</p>
      <p>To move forward, please let us know:</p>
      <ol>
          <li>Your preferred method of communication (phone call, virtual meeting, etc.).</li>
          <li>A convenient date and time for our initial consultation.</li>
          <li>Any specific training topics or areas of focus you have in mind.</li>
      </ol>
      <p>Please feel free to reach out to us on <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a></p>
      <p><b>Whatsapp</b>: <a href="https://wa.link/biujvn">https://wa.link/biujvn</a></p>
      <p><b>Phone</b>: +91-7303722557</p>
      <p>Thanks,</p>
      <p><b>Team - SnowLabs Technology</b></p>
    `;

      mailSubject = 'Your Request for Quotation - SnowLabs Technology';
      if (formName === FormNameEnum.CONTACT_US)
        mailSubject =
          'Your Query for Corporate Training Services - SnowLabs Technology';

      if (formName === FormNameEnum.UPSKILL)
        mailSubject =
          'Your Query for Corporate Training Services - SnowLabs Technology';
    }

    try {
      // Send a welcome email to the lead's email address.
      if (mailBody)
        this.mailService.commonMail({
          to: email,
          subject: mailSubject,
          text: mailBody,
        });

      // Capture the new lead's data using LeadSQService.
      await this.LeadSQService.captureNewLead({
        firstName: name?.split(' ')[0],
        lastName: name?.split(' ')[1],
        countryCode: countryCode,
        email: email,
        phone: contactNo,
        company: organization,
        formName: formName,
        pageName: pageName,
        designation: designation,
        message: message,
      });
    } catch (err) {
      // Handle specific error cases when capturing new lead data.
      if (err instanceof AxiosError) {
        if (err.response.data.ExceptionType !== 'MXDuplicateEntryException') {
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            err.response.data.ExceptionMessage,
          );
        }
      } else {
        throw err;
      }
    }

    // Save the corporate track entry.
    await this.corporateTrackRepo.save(track);
  }

  async findAllCoporateLead(queryLeadsDto: QueryCorporateLeadDTO) {
    const {
      search = '',
      limit = 10, // Default limit of leads per page.
      page = 1, // Default page number.
      status, // Lead status.
      queryId, // Identifier for the query.
      category, // Category of leads.
    } = queryLeadsDto;

    // Use Promise.all() to concurrently fetch different sets of lead data.
    const [leads, total, converted, lost, processing] = await Promise.all([
      // Fetch leads from the repository based on specified criteria.
      this.corporateRepo.find({
        where: {
          status, // Match leads with the specified status.
          query: ILike(`%${search}%`), // Match leads with a partial match to search term.
          category, // Match leads with the specified category.
          queryId, // Match leads with the provided query ID.
        },
        take: limit, // Limit the number of leads per page.
        skip: (page - 1) * limit, // Calculate the appropriate offset for pagination.
        order: { createdDate: 'DESC' },
        // relations: { student: { auth: true } }, // Include related student data with authenticated information.
      }),
      // Count the total number of leads in the repository.
      this.corporateRepo.count(),
      this.corporateRepo.count({ where: { status: LeadsStatus.CONVERTED } }),
      this.corporateRepo.count({ where: { status: LeadsStatus.LOST } }),
      this.corporateRepo.count({ where: { status: LeadsStatus.PROCESSING } }),
    ]);

    // Return an object containing the retrieved lead data and various counts.
    return {
      data: leads, // Array of retrieved leads.
      totalCount: total, // Total number of leads in the repository.
      lostCount: lost, // Count of leads with the "Lost" status.
      convertedCount: converted, // Count of leads with the "Converted" status.
      processingCount: processing, // Count of leads with the "Processing" status.
    };
  }

  async updateCorporateLead(id: string, updateDto: UpdateCorporateLeadDTO) {
    const lead = await this.corporateRepo.findOne({ where: { id } });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    const track = new CorporateTrack();
    const trackChange = [
      'leadStatus',
      'comments',
      'trainerStatus',
      'trainerCostType',
      'skillCategory',
      'trainer',
      'trainerCost',
      'trainerCostToClient',
      'trainerCostTypeClient',
      'techCall',
    ].reduce(
      (acc, curr) => Object.keys(updateDto).includes(curr) || acc,
      false,
    );
    lead.name = updateDto.name;
    lead.email = updateDto.email;
    lead.query = updateDto.query;
    lead.category = updateDto.category;
    track.lead = lead;
    if (updateDto.isOpened && !lead.isOpened) {
      track.status = LeadsStatus.PENDING;
      lead.status = LeadsStatus.PENDING;
      lead.isOpened = true;
      await this.corporateRepo.save(lead);
      return await this.corporateTrackRepo.save(track);
    }
    track.status = updateDto.leadStatus;
    lead.status = updateDto.leadStatus;
    track.comments = updateDto.comments;
    track.trainerStatus = updateDto.trainerStatus;
    track.techCall = updateDto.techCall;
    track.trainerCost = updateDto.trainerCost;
    track.trainerCostType = updateDto.trainerCostType;
    track.trainerCostToClient = updateDto.trainerCostToClient;
    track.trainerCostTypeClient = updateDto.trainerCostTypeClient;
    if (updateDto.trainer) {
      const trainer = await this.trainerRepo.findOne({
        where: { id: updateDto.trainer },
      });
      if (!trainer)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid trainer ID');
      track.trainer = trainer;
    }
    if (trackChange) await this.corporateTrackRepo.save(track);

    return await this.corporateRepo.save(lead);
  }

  async findOneCorporateLead(id: string) {
    const lead = await this.corporateRepo.findOne({
      where: { id },
      relations: {
        statusTrack: { trainer: { auth: true }, requiredSkillCategory: true },
      },
      order: { statusTrack: { createdDate: 'ASC' } },
    });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    return lead;
  }

  async softDeleteCorporate(id: string) {
    const lead = await this.corporateRepo.findOne({ where: { id } });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    return await this.corporateRepo.softDelete({ id });
  }

  async createHelpdesk(createHelpDto: CreateHelpdeskDTO) {
    const { query, queryType, studentId } = createHelpDto;
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: { auth: true },
    });
    if (!student)
      throw new HttpException(HttpStatus.BAD_REQUEST, "Student doesn't exist");
    const helpdesk = new Helpdesk();
    helpdesk.queryId = generateQuerySequence();
    helpdesk.query = query;
    helpdesk.queryCategoryType = queryType;
    helpdesk.student = student;
    const leadTrack = new HelpdeskTrack();
    const savedHelpdesk = await this.helpdeskRepo.save(helpdesk);
    leadTrack.helpdesk = savedHelpdesk;
    const savedTrack = await this.helpTrackRepo.save(leadTrack);
    savedHelpdesk.status = savedTrack.status;
    const adminMailBody = `
    <p>Query </p>
    <p>Name: ${student.auth.name}</p>
    <p>Email: ${student.auth.email}</p>
    <p>Student ID: ${student.studentId}</p>
    <p>Phone Number: ${student.auth.phoneNumber}</p>
    <p>Query: ${query}</p>`;

    this.mailService.sendViaSendGrid({
      to: process.env.MAIL_MAIL,
      subject: `Query ID: ${helpdesk.queryId}`,
      text: adminMailBody,
    });

    return await this.helpdeskRepo.save(savedHelpdesk);
  }

  async updateHelpdesk(updatedto: UpdateHelpdeskDTO, id: string) {
    const helpdesk = await this.helpdeskRepo.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!helpdesk)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    if (updatedto.isOpened && !helpdesk.isOpened) {
      const helpTrack = new HelpdeskTrack();
      helpTrack.status = HelpDeskStatus.PENDING;
      helpTrack.helpdesk = helpdesk;
      helpdesk.isOpened = true;
      await this.helpTrackRepo.save(helpTrack);
      return await this.helpdeskRepo.save(helpdesk);
    }
    const track = new HelpdeskTrack();
    track.helpdesk = helpdesk;
    track.status = updatedto.status;
    track.comments = updatedto.comments;
    helpdesk.status = updatedto.status;

    if (updatedto.status || updatedto.comments)
      await this.helpTrackRepo.save(track);

    return await this.helpdeskRepo.save(helpdesk);
  }

  async findAllHelpdesk(queryLeadsDto: QueryHelpdeskDTO) {
    const {
      search = '',
      limit = 10,
      page = 1,
      status,
      queryId = '',
      category,
    } = queryLeadsDto;
    const [leads, total, solved, unsolved] = await Promise.all([
      this.helpdeskRepo.find({
        where: {
          status,
          query: ILike(`%${search}%`),
          queryCategoryType: category,
          queryId: ILike(`%${queryId}%`),
        },
        take: limit,
        skip: (page - 1) * limit,
        order: { createdDate: 'DESC' },
        relations: { student: { auth: true } },
      }),
      // this.helpdeskRepo
      //   .createQueryBuilder('hd')
      //   .select(['hd.id', 'hd.query', 'hd.isOpened'])
      //   .addSelect(
      //     'select ht.status from "helpdesk-track" as ht join helpdesks h2 on hd.id = ht."helpdeskId" order by ht."createdAt" desc limit 1',
      //   )
      //   .getMany(),
      this.helpdeskRepo.count(),

      this.helpdeskRepo.count({
        where: { status: HelpDeskStatus.RESOLVED },
      }),
      this.helpdeskRepo.count({
        where: [
          { status: HelpDeskStatus.NEW },
          { status: HelpDeskStatus.PENDING },
        ],
      }),
    ]);
    return {
      data: leads,
      totalCount: total,
      unsolvedCount: unsolved,
      solvedCount: solved,
    };
  }

  async findOneHelpdesk(id: string) {
    const lead = await this.helpdeskRepo.findOne({
      where: { id },
      relations: {
        student: { auth: true },
        statusTrack: true,
      },
      order: { statusTrack: { createdAt: 'ASC' } },
    });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    return lead;
  }

  async softDeleteHelpdesk(id: string) {
    const lead = await this.helpdeskRepo.findOne({ where: { id } });
    if (!lead) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    return await this.helpdeskRepo.softDelete({ id });
  }
}
