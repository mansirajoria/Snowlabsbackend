import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceEntity } from './entities/create-resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { SessionEntity } from 'session/entities/session.entity';
import { ResourceQuery } from './dto/query-resource.dto';
import HttpException from '@utils/exceptions/HttpException';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { BatchEntity } from '@batch/entities/batch.entity';
import { AssignmentEnum, ResourceType } from '@utils/enum';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { Student } from '@students/entities/student.entity';
import * as moment from 'moment';
import { PendingSessionDto } from 'student-lms/dto/search.dto';
import { CopyResourseDto } from '@session/entities/copy-resource.entity';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { QuizQuestionEntity } from 'quiz/entities/question-quiz.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(ResourceEntity)
    private resourceRepo: Repository<ResourceEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Enrollment)
    private enrollMentRepo: Repository<Enrollment>,
    @InjectRepository(AssignmentSubmission)
    private assignmentRepo: Repository<AssignmentSubmission>,
    @InjectRepository(QuizEntity)
    private quizRepo: Repository<QuizEntity>,
    @InjectRepository(QuizQuestionEntity)
    private quizQuestionRepo: Repository<QuizQuestionEntity>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async createResource(payload: CreateResourceDto): Promise<ResourceEntity> {
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
    });
    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
    const isAlreadyExistsName = await this.resourceRepo.findOne({
      where: {
        session: { id: payload.sessionId },
        resourceName: payload.resourceName,
        resourceType: payload.resourceType,
      },
    });
    if (isAlreadyExistsName)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Resource name already exist',
      );
    const resource = new ResourceEntity();
    resource.resourceType = payload.resourceType;
    resource.session = sessionDetails;
    resource.resourceName = payload.resourceName;
    resource.resourceFile = payload.resourceFile;
    resource.resourceLink = payload.resourceLink;
    resource.isPublish = payload.isPublish;
    if (payload.dueDate)
      resource.dueDate = moment(payload.dueDate, 'YYYY-MM-DD')
        .endOf('day')
        .toDate();
    const createResource = this.resourceRepo.create(resource);
    const resourceDetails = await this.resourceRepo.save(createResource);
    if (!resourceDetails)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Resource name already exist',
      );
    const resourceObject: Object = {
      RECORDING: 'isRecordingAdded',
      RESOURCE: 'isResourcesAdded',
      LINKS: 'isLinksAdded',
      ASSIGNMENT: 'isAssignmentAdded',
    };
    const updateKeys: string = resourceObject[`${payload.resourceType}`];
    sessionDetails[`${updateKeys}`] = true;
    await this.sessionRepository.save(sessionDetails);
    return resourceDetails;
  }

  async getAllResource(
    query: ResourceQuery,
  ): Promise<{ totalItems: Number; resources: ResourceEntity[] }> {
    const { pageLength = 10, pageNo = 1 } = query;
    const resourcesQuery = this.resourceRepo
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.session', 'session')
      .where('session.id=:id', { id: query.sessionId })
      .andWhere(
        query.resourceName ? 'resource.resourceName ILIKE :search' : '1=1',
        { search: `%${query.resourceName}%` },
      )
      .orderBy('resource.createdDate', 'DESC');
    const [resources, totalItems] = await Promise.all([
      resourcesQuery
        .take(pageLength)
        .skip((pageNo - 1) * pageLength)
        .getMany(),
      resourcesQuery.getCount(),
    ]);
    return {
      totalItems,
      resources,
    };
  }

  async getResource(id: string) {
    const isRexsourceExits: ResourceEntity = await this.resourceRepo.findOne({
      where: { id: id },
      relations: ['session'],
    });
    return isRexsourceExits;
  }

  async updateResource(
    id: string,
    payload: UpdateResourceDto,
  ): Promise<ResourceEntity> {
    const resourceDetails = await this.resourceRepo.findOne({
      where: { id },
      relations: ['session'],
    });
    if (!resourceDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid resource');
    const isAlreadyExistsName = await this.resourceRepo.findOne({
      where: {
        session: { id: resourceDetails.session.id },
        resourceName: payload.resourceName,
        resourceType: resourceDetails.resourceType,
        id: Not(id),
      },
    });
    if (isAlreadyExistsName)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Resource name already exist',
      );
    resourceDetails.isPublish = payload.isPublish;
    resourceDetails.resourceFile = payload.resourceFile;
    resourceDetails.resourceLink = payload.resourceLink;
    console.log(payload.dueDate);
    if (payload.dueDate)
      resourceDetails.dueDate = moment(payload.dueDate, 'YYYY-MM-DD')
        .startOf('days')
        .toDate();
    resourceDetails.resourceName = payload.resourceName;
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: resourceDetails.session.id },
    });
    const query = `select s2.id  from enrollment e  
    join batch b on e."batchId"=b.id join student s2 on 
    s2.id =e."studentId"  join "session" s on s."batchId" =b.id 
   join resource r on s.id =r."sessionId" where r."resourceType" ='ASSIGNMENT' and r.id=$1 and e."deletedAt" is null;`;
    const students = await this.enrollMentRepo.query(query, [id]);
    if (students.length) {
      const assignmentPromises = students.map(async (student) => {
        const assignmentSubmission = await this.assignmentRepo.findOne({
          where: { student: { id: student.id }, assignment: { id } },
        });

        if (assignmentSubmission) {
          assignmentSubmission.isPublish = payload.isPublish;
          return this.assignmentRepo.save(assignmentSubmission);
        } else {
          const studentDetails = await this.studentRepo.findOne({
            where: { id: student.id },
          });

          const newAssignment = new AssignmentSubmission();
          newAssignment.assignment = resourceDetails;
          newAssignment.status = AssignmentEnum.PENDING;
          newAssignment.student = studentDetails;
          newAssignment.isPublish = payload.isPublish;
          newAssignment.session = sessionDetails;
          return this.assignmentRepo.save(newAssignment);
        }
      });

      await Promise.all(assignmentPromises);
    }
    return await this.resourceRepo.save(resourceDetails);
  }

  async deleteResource(id: string) {
    const resourceDetails = await this.resourceRepo.findOne({
      where: { id },
      relations: ['session'],
    });
    if (!resourceDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid resource');
    await this.resourceRepo.softDelete(id),
      await this.updateResourceExistStatus(
        resourceDetails.session.id,
        resourceDetails.resourceType,
      );
  }

  async updateResourceExistStatus(sessionId: string, resource: ResourceType) {
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
    const resourceData = await this.resourceRepo.find({
      where: { session: { id: sessionId }, resourceType: resource },
    });
    if (!resourceData.length) {
      switch (resource) {
        case ResourceType.ASSIGNMENT: {
          sessionDetails.isAssignmentAdded = false;
          break;
        }
        case ResourceType.LINKS: {
          sessionDetails.isLinksAdded = false;
          break;
        }
        case ResourceType.STUDY_MATERIAL: {
          sessionDetails.isResourcesAdded = false;
          break;
        }
        case ResourceType.RECORDING: {
          sessionDetails.isRecordingAdded = false;
          break;
        }
      }
      await this.sessionRepository.save(sessionDetails);
    }
    return;
  }
  async trainerAssignments(batchId: string): Promise<ResourceEntity[]> {
    const isBatchExist = await this.batchRepo.findOne({
      where: { id: batchId },
    });
    if (!isBatchExist)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid batch id');

    const query = `SELECT
    r.id,
    r."resourceName",
    r."dueDate",
    s."sessionName" AS "sessionName",
    s."id" AS "sessionId",
    (
        SELECT COUNT(*)
        FROM "assignment-submissions" a
        WHERE a."status" = 'Submitted'
        AND a."assignmentId" = r.id
    ) AS "totalAssignments",
    (
        SELECT COUNT(*)
        FROM "assignment-submissions" a
        WHERE a."isEvaluated" = true
        AND a."assignmentId" = r.id
    ) AS "totalEvaluatedAssignments"
FROM
    resource r
INNER JOIN
    "session" s
ON
    r."sessionId" = s.id
WHERE
    r."resourceType" = 'ASSIGNMENT'
AND
    s."batchId" = $1
`;
    const assignments = await this.resourceRepo.query(query, [batchId]);
    return assignments;
  }

  async getAssignment(assignmentId: string): Promise<ResourceEntity> {
    const assignment = await this.resourceRepo.findOne({
      where: { id: assignmentId, resourceType: ResourceType.ASSIGNMENT },
    });
    if (!assignment)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'assinment not found');
    return assignment;
  }

  async sessionRecording(
    paylaod: PendingSessionDto,
  ): Promise<ResourceEntity[]> {
    const recordings = await this.resourceRepo.find({
      where: {
        session: { id: paylaod.sessionId },
        resourceType: ResourceType.RECORDING,
        isPublish: true,
      },
    });
    return recordings;
  }

  async copyResource(payload: CopyResourseDto) {
    const [previousResources, previousQuizes] = await Promise.all([
      this.resourceRepo.find({
        where: { session: { id: payload.oldSessionId } },
      }),
      this.quizRepo.find({
        where: { session: { id: payload.oldSessionId } },
        relations: ['quizes'],
      }),
    ]);
    if (!previousResources.length && !previousQuizes.length)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'no resource available');
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: payload.newSessionId },
    });

    if (!sessionDetails) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
    }
    const promises = previousResources.map(async (resource) => {
      const isResourceExists = await this.resourceRepo.findOne({
        where: {
          session: { id: payload.newSessionId },
          resourceName: resource.resourceName,
          resourceType: resource.resourceType,
        },
      });

      if (isResourceExists) {
        return null; // Skip if resource already exists
      }
      const newResource = new ResourceEntity();
      newResource.resourceName = resource.resourceName;
      newResource.resourceType = resource.resourceType;
      newResource.session = sessionDetails;
      newResource.resourceFile = resource.resourceFile;
      newResource.resourceLink = resource.resourceLink;
      newResource.dueDate = resource.dueDate;

      const resourceDetails = await this.resourceRepo.save(newResource);

      if (!resourceDetails) {
        throw new HttpException(HttpStatus.BAD_REQUEST, 'resource not added');
      }

      const resourceObject = {
        RECORDING: 'isRecordingAdded',
        RESOURCE: 'isResourcesAdded',
        LINKS: 'isLinksAdded',
        ASSIGNMENT: 'isAssignmentAdded',
      };

      const updateKey = resourceObject[resource.resourceType];
      sessionDetails[updateKey] = true;

      await this.sessionRepository.save(sessionDetails);

      return resourceDetails;
    });
    const quizPromises = previousQuizes.map(async (quizDetail) => {
      const isAlreadyExistsQuiz = await this.quizRepo.findOne({
        where: {
          session: { id: payload.newSessionId },
          quizName: quizDetail.quizName,
        },
      });
      if (isAlreadyExistsQuiz) {
        return null; // Skip if resource already exists
      }
      await this.quizRepo.manager.transaction(
        async (transactionalEntityManager) => {
          const quizData = new QuizEntity();
          quizData.quizName = quizDetail.quizName;
          quizData.session = sessionDetails;
          quizData.duration = quizDetail.duration;
          quizData.dueDate = moment(quizDetail.dueDate, 'YYYY-MM-DD')
            .startOf('day')
            .toDate();

          const savedQuizDetails = await transactionalEntityManager.save(
            quizData,
          );
          if (!savedQuizDetails) {
            throw new HttpException(HttpStatus.BAD_REQUEST, 'quiz not created');
          }

          let questionDetails = [];
          for (let i = 0; i < quizDetail?.quizes.length; i++) {
            const questionObject = {
              quiz: savedQuizDetails,
              question: quizDetail?.quizes[i].question,
              options: quizDetail?.quizes[i].options,
              correctAnswer: quizDetail?.quizes[i].correctAnswer,
            };
            questionDetails.push(questionObject);
          }

          const quizQuestions = await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(QuizQuestionEntity)
            .values(questionDetails)
            .execute();

          if (!quizQuestions) {
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'questions not created',
            );
          }

          sessionDetails.isQuizAdded = true;
          await transactionalEntityManager.save(sessionDetails);
        },
      );
    });
    // Use Promise.all to await all promises concurrently
    const resources = await Promise.all([
      promises.filter(Boolean),
      quizPromises.filter(Boolean),
    ]);

    // 'resources' will contain an array of successfully added resources
  }
}
