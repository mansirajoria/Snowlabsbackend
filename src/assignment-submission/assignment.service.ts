import { HttpStatus, Injectable } from '@nestjs/common';
import { SubmitDto } from './dto/submit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import HttpException from '@utils/exceptions/HttpException';
import { AssignmentEnum } from '@utils/enum';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Student } from '@students/entities/student.entity';
import { HttpRequest } from 'aws-sdk';
import { DueAssignmentDto, ListDto } from './dto/assignment.dto';
import { BatchEntity } from '@batch/entities/batch.entity';
import { AssignmentEvaluation } from './dto/assignments-evaluation..dto';
import { Trainer } from '@trainer/entities/trainer.entity';
import { NotificationsService } from '@notifications/notifications.service';

@Injectable()
export class AssignmentSubmissionService {
  constructor(
    @InjectRepository(AssignmentSubmission)
    private assignRepo: Repository<AssignmentSubmission>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(ResourceEntity)
    private resourseRepo: Repository<ResourceEntity>,
    @InjectRepository(Trainer)
    private trainerRepo: Repository<Trainer>,
    private notificationsRepo: NotificationsService,
  ) {}
  async submitAssignment(payload: SubmitDto) {
    //submit assignment notification to trainer
    const assignmentDetails = await this.resourseRepo.findOne({
      where: { id: payload.assignmentId },
      relations: ['session'],
    });
    if (!assignmentDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid assignment');
    if (assignmentDetails.dueDate < new Date())
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'The due date of this assignment has passed',
      );
    const assignmentSubmissionsData = await this.assignRepo.findOne({
      where: { id: payload.submissionId },
    });

    if (!assignmentSubmissionsData)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'inavlid submission id');

    (assignmentSubmissionsData.submissionLink = payload.submissionLink),
      (assignmentSubmissionsData.status = AssignmentEnum.SUBMITTED);
    assignmentSubmissionsData.submissionDate = new Date();
    await this.assignRepo.save(assignmentSubmissionsData);
  }

  async getAssignments(payload: ListDto): Promise<AssignmentSubmission[]> {
    const studentDetailsDetails = await this.studentRepo.findOne({
      where: { auth: { id: payload.authId } },
    });
    if (!studentDetailsDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid student');
    const assignments = await this.assignRepo.find({
      where: {
        student: { id: studentDetailsDetails.id },
        session: { id: payload.sessionId },
        isPublish: true,
      },
      relations: ['assignment'],
    });
    return assignments;
  }

  async dueAssignments(
    authId: string,
  ): Promise<{ assignments: AssignmentSubmission[]; total: number }> {
    const studentDetailsDetails = await this.studentRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (!studentDetailsDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid student');
    const [assignments, total] = await this.assignRepo.findAndCount({
      where: {
        student: { id: studentDetailsDetails.id },
        isPublish: true,
      },
      relations: ['assignment'],
    });
    return { assignments, total };
  }

  async sessionAssignments(
    assessmentId: string,
    authId: string,
  ): Promise<{
    pendingAssignments: AssignmentSubmission[];
    completeAssignments: AssignmentSubmission[];
    totalPendingAssignments: number;
    totalCompleteAssignments: number;
  }> {
    const trainerDetails = await this.trainerRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (!trainerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid trainer id');
    const assignmentsQuery = this.assignRepo
      .createQueryBuilder('assignmentsSubmission')
      .leftJoinAndSelect('assignmentsSubmission.assignment', 'assignments')
      .where('assignmentsSubmission.status = :status', {
        status: AssignmentEnum.SUBMITTED,
      })
      .andWhere('assignments.id = :id', { id: assessmentId })
      .leftJoinAndSelect('assignmentsSubmission.student', 'student')
      .leftJoinAndSelect('student.auth', 'auth')
      .select([
        'assignmentsSubmission.id AS id',
        'auth.id AS "authId"',
        'assignments.dueDate AS "dueDate"',
        'assignments.id AS "assignmentId"',
        'assignments.resourceFile as "resourceFile"',
        'auth.name AS "studentName"',
        'assignmentsSubmission.submissionLink AS "submissionLink"',
        'assignmentsSubmission.submissionDate AS "submissionDate"',
        'assignmentsSubmission.evaluationDate AS "evaluationDate"',
        'assignmentsSubmission.obtainMarks AS "obtainMarks"',
        'assignmentsSubmission.totalMarks AS "totalMarks"',
        'assignmentsSubmission.isPassed AS "isPassed"',
      ]);

    const completeAssignmentsQuery = assignmentsQuery;
    const pendingAssignmentsQuery = assignmentsQuery;
    const [
      pendingAssignments,
      totalPendingAssignments,
      completeAssignments,
      totalCompleteAssignments,
    ] = await Promise.all([
      pendingAssignmentsQuery
        .andWhere('assignmentsSubmission.isEvaluated = :isEvaluated', {
          isEvaluated: false,
        })
        .getRawMany(),
      pendingAssignmentsQuery
        .andWhere('assignmentsSubmission.isEvaluated = :isEvaluated', {
          isEvaluated: false,
        })
        .getCount(),
      completeAssignmentsQuery
        .andWhere('assignmentsSubmission.isEvaluated = :isEvaluated', {
          isEvaluated: true,
        })
        .getRawMany(),
      completeAssignmentsQuery
        .andWhere('assignmentsSubmission.isEvaluated = :isEvaluated', {
          isEvaluated: true,
        })
        .getCount(),
    ]);

    return {
      pendingAssignments,
      completeAssignments,
      totalPendingAssignments,
      totalCompleteAssignments,
    };
  }

  async assignmentsEvaluation(payload: AssignmentEvaluation) {
    const submissionDetails = await this.assignRepo.findOne({
      where: { id: payload.submissionId },
      relations: ['student', 'assignment'],
    });

    if (!submissionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid submission Id');
    submissionDetails.feedBack = payload.feedBack;
    submissionDetails.obtainMarks = payload.obtainMarks;
    submissionDetails.evaluationDate = new Date();
    submissionDetails.isEvaluated = true;
    submissionDetails.isPassed = payload.obtainMarks < 3 ? false : true;
    //notify student when assignment is evaluated
    let result = await this.notificationsRepo.create({
      title: 'Marks Released',
      description: `The grades for ${submissionDetails.assignment.resourceName} are now available. Check your score.`,
      receiverType: 'Students',
      studentId: `${submissionDetails.student.id}`,
    });
    await this.assignRepo.save(submissionDetails);
  }
}
