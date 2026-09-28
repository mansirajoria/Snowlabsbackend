import { HttpStatus, Injectable } from '@nestjs/common';
import { FeedbackForm } from './entities/feedback-form.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import HttpException from '@utils/exceptions/HttpException';
import {
  FeedbackFormDto,
  FeedbackQuestion,
} from 'feedbacks/dto/feedback-form.dto';
import { FeedbackQuestions } from './entities/feedback-questions.entity';
import { AssignmentEnum, BatchTypeEnum, FeedBackType } from '@utils/enum';
import { CourseFeedbackDto, SearchFeedBackDto } from './dto/search-form.dto';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { FeedbackSubmission } from './entities/feedback-form-submission.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackForm)
    private feedbackFormRepo: Repository<FeedbackForm>,
    @InjectRepository(FeedbackQuestions)
    private feedbackQuestionRepo: Repository<FeedbackQuestions>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(FeedbackSubmission)
    private feedbackSubmissionRepo: Repository<FeedbackSubmission>,
  ) {}
  async createFeedbackForm(payload: FeedbackFormDto) {
    const { feedback } = payload;
    const isFeedbackExist = await this.feedbackFormRepo.findOne({
      where: { type: payload.type },
    });
    if (isFeedbackExist)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `${payload.type} form is already available`,
      );
    return this.feedbackFormRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const feedbackForm = new FeedbackForm();
        feedbackForm.type = payload.type;
        const feedbackFormDetails = await transactionalEntityManager.save(
          feedbackForm,
        );

        const questionObject: Array<Object> = [];
        for (let i = 0; i < feedback.length; i++) {
          const questions = {
            question: feedback[i].question,
            options: feedback[i].options,
            questionType: feedback[i].questionType,
            feedbackForm: feedbackFormDetails,
          };
          questionObject.push(questions);
        }

        const feedbackQuestions = await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(FeedbackQuestions) // Replace with your MockTestQuestionEntity class name
          .values(questionObject)
          .execute();

        // You can return the created mock test details if needed
        return feedbackQuestions;
      },
    );
  }

  async feedbackForm(paylaod: SearchFeedBackDto): Promise<FeedbackForm> {
    const formDetails = await this.feedbackFormRepo.findOne({
      where: { type: paylaod.formType },
      relations: ['questions'],
    });
    if (!formDetails)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `${paylaod.formType} is not available`,
      );
    return formDetails;
  }

  async checkFeedback(authId: string, batchId: string): Promise<any> {
    const postPreCourseFeedback = await this.feedbackSubmissionRepo.findOne({
      where: [
        {
          student: { auth: { id: authId } },
          type: FeedBackType.POST_COURSE,
          status: AssignmentEnum.PENDING,
          batch: { endDate: LessThan(new Date()), id: batchId },
        },
        {
          student: { auth: { id: authId } },
          type: FeedBackType.POST_COURSE,
          status: AssignmentEnum.PENDING,
          batch: { batchType: BatchTypeEnum.SELF },
        },
      ],
      relations: ['batch'],
    });

    if (!postPreCourseFeedback) {
      return;
    }
    const response: Object = {
      formType: FeedBackType.POST_COURSE,
      submissionId: postPreCourseFeedback.id,
    };
    return response;
  }
}
