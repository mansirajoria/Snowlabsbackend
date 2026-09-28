import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizEntity } from './entities/create-quiz.entity';
import {
  BulkUploadQuestion,
  CreateQuizDto,
  QuizQuestion,
} from './dto/create-quiz.dto';
import { SessionEntity } from 'session/entities/session.entity';
import { TakeQuizDto } from './dto/user-quiz-answer.dto';
import { QuizStatusType } from '@utils/enum';
import HttpException from '@utils/exceptions/HttpException';
import { QuizQuestionEntity } from './entities/question-quiz.entity';
import * as moment from 'moment';
import { SearchQuizDto } from './dto/search-quiz.dto';
import { EditQuizDto, EditQuizQuestion } from './dto/edit-quiz.dto';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { QuizSubmission } from 'quiz-submission/entities/quiz-submission.entity';
import { Student } from '@students/entities/student.entity';
import { ResultDto } from 'student-lms/dto/result.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizEntity) private quizRepo: Repository<QuizEntity>,
    @InjectRepository(QuizQuestionEntity)
    private quizQuestionRepo: Repository<QuizQuestionEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
    @InjectRepository(Enrollment)
    private enrollRepo: Repository<Enrollment>,
    @InjectRepository(QuizSubmission)
    private quizSubmissionRepo: Repository<QuizSubmission>,
    @InjectRepository(Student)
    private studnentRepo: Repository<Student>,
  ) {}

  quizNameGenerate(name: string): string {
    // Split the input quiz name into name and number parts
    const [namePart, numberPart] = name.split('-');
    // Increment the quiz number
    const nextQuizNumber = parseInt(numberPart) + 1;
    // Generate the next quiz name by combining the name part and the new quiz number
    const nextQuizName = `${namePart}-${nextQuizNumber}`;
    return nextQuizName;
  }
  async createSessionQuiz(payload: QuizQuestion) {
    const { questions } = payload;
    let date = payload.dueDate.toString();
    let quizName: string;
    if (!questions.length)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'questions not found');
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
    });

    if (!sessionDetails)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'session not found or quiz already created',
      );

    const latestQuiz = await this.quizRepo
      .createQueryBuilder('quiz')
      .orderBy('quiz.createdDate', 'DESC')
      .select('quiz.quizName AS "quizName"')
      .getRawOne();
    if (latestQuiz) {
      quizName = this.quizNameGenerate(latestQuiz.quizName);
    } else {
      quizName = 'Quiz-1';
    }
    return this.quizRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const quizData = new QuizEntity();
        quizData.quizName = payload.quizName;
        quizData.session = sessionDetails;
        quizData.duration = payload.duration;
        quizData.dueDate = moment(date, 'YYYY-MM-DD').endOf('day').toDate();

        const quizDetails = await transactionalEntityManager.save(quizData);
        if (!quizDetails)
          throw new HttpException(HttpStatus.BAD_REQUEST, 'quiz not created');

        let questionDetials: Array<Object> = [];
        for (let i = 0; i < questions.length; i++) {
          const questionObject = {
            quiz: quizDetails,
            question: questions[i].question,
            options: questions[i].options,
            correctAnswer: questions[i].correctAnswer,
          };
          questionDetials.push(questionObject);
        }

        const quizQuestions = await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(QuizQuestionEntity) // Replace with your QuizQuestionEntity class name
          .values(questionDetials)
          .execute();
        if (!quizQuestions)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'questions not created',
          );

        sessionDetails.isQuizAdded = true;
        await transactionalEntityManager.save(sessionDetails);
      },
    );
  }

  // async findAllQuizzesBySessionId(sessionId: string): Promise<QuizEntity[]> {
  //   const quizDetails: QuizEntity[] = await this.quizRepo.find({
  //     where: { session: { id: sessionId } },
  //     select: ['id', 'createdDate', 'quizName', 'question', 'options'],
  //   });
  //   return quizDetails;
  // }

  async getQuiz(id: string): Promise<QuizEntity> {
    const isQuizExits: QuizEntity = await this.quizRepo.findOne({
      where: { id: id },
      relations: ['session'],
    });
    return isQuizExits;
  }

  async getQuizQuestions(id: string): Promise<QuizQuestionEntity[]> {
    const quizDetails = await this.quizRepo.findOne({ where: { id } });
    if (!quizDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid quiz');
    const quizQuestions = await this.quizQuestionRepo.find({
      where: { quiz: { id } },
      select: ['id', 'createdDate', 'question', 'options'],
    });
    return quizQuestions;
  }

  async sessionQuizList(
    payload: SearchQuizDto,
  ): Promise<{ quizzes: QuizEntity[]; total: number }> {
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
    });

    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid session ');
    const limit = payload.pageLength < 1 ? 1 : payload.pageLength || 10;
    const page = payload.pageNo < 1 ? 1 : payload.pageNo || 1;
    const quizQuery = this.quizRepo
      .createQueryBuilder('quiz')
      .leftJoin('quiz.session', 'session')
      .where('session.id=:id', { id: payload.sessionId })
      .leftJoinAndSelect('quiz.quizes', 'quizQuestions');
    if (payload.quizName)
      quizQuery.andWhere('quiz.quizName ILike :name', {
        name: `%${payload.quizName}%`,
      });
    const [quizzes, total] = await Promise.all([
      quizQuery
        .take(limit)
        .skip((page - 1) * limit)
        .getMany(),
      quizQuery.getCount(),
    ]);
    return { quizzes, total };
  }

  async addQuestion(
    quizId: string,
    payload: BulkUploadQuestion,
  ): Promise<QuizQuestionEntity[]> {
    const quizDetails = await this.quizRepo.findOne({
      where: { id: quizId },
    });
    if (!quizDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'quiz not found');

    const { questions } = payload;
    if (!questions.length)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'questions not found');
    let questionDetials: Array<Object> = [];
    for (let i = 0; i < questions.length; i++) {
      const questionObject = {
        quiz: quizDetails,
        question: questions[i].question,
        options: questions[i].options,
        correctAnswer: questions[i].correctAnswer,
      };
      questionDetials.push(questionObject);
    }
    await this.quizQuestionRepo
      .createQueryBuilder()
      .insert()
      .values(questionDetials)
      .execute();
    return await this.quizQuestionRepo.find({
      where: { quiz: { id: quizId } },
    });
  }

  async removeQuiz(id: string) {
    const quizDetails = await this.quizRepo.findOne({
      where: { id },
      relations: ['session'],
    });
    if (!quizDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Quiz not found');
    const quizPromise = this.quizRepo.softDelete({ id });
    const questionPromise = this.quizQuestionRepo.softDelete({
      quiz: { id },
    });
    await Promise.all([quizPromise, questionPromise]);
    await this.quizExistStatus(quizDetails.session.id);
  }

  async quizExistStatus(sessionId: string) {
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
    const quizzes = await this.quizRepo.find({
      where: { session: { id: sessionId } },
    });
    if (!quizzes.length) {
      sessionDetails.isQuizAdded = false;
      await this.sessionRepository.save(sessionDetails);
    }
    return;
  }
  async removeQuestion(id: string) {
    const questionDetails = this.quizQuestionRepo.findOne({
      where: { id },
    });
    if (!questionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'question not found');
    await this.quizQuestionRepo.softDelete({ id });
  }

  async editQuiz(id: string, payload: EditQuizDto) {
    const quizDetails = await this.quizRepo.findOne({
      where: { id },
      relations: ['session'],
    });
    if (!quizDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Quiz not found');
    quizDetails.duration = payload.duration;
    quizDetails.quizName = payload.quizName;
    quizDetails.isPublish = payload.isPublish;
    if (payload.dueDate)
      quizDetails.dueDate = moment(payload.dueDate, 'YYYY-MM-DD')
        .endOf('day')
        .toDate();

    const quizQuery = `select s2.id  from enrollment e  
      join batch b on e."batchId"=b.id join student s2 on 
      s2.id =e."studentId"  join "session" s on s."batchId" =b.id 
      join quiz q on s.id =q."sessionId" where q.id =$1  and e."deletedAt" is null; `;
    const students = await this.enrollRepo.query(quizQuery, [id]);
    const sessionDetails = await this.sessionRepository.findOne({
      where: { id: quizDetails.session.id },
    });
    if (students.length) {
      const quizSubmissionPromises = students.map(async (student) => {
        const quizSubmission = await this.quizSubmissionRepo.findOne({
          where: { quiz: { id }, student: { id: student.id } },
        });

        if (quizSubmission) {
          quizSubmission.isPublish = payload.isPublish;
          return this.quizSubmissionRepo.save(quizSubmission);
        } else {
          const studentDetails = await this.studnentRepo.findOne({
            where: { id: student.id },
          });

          const newSubmission = new QuizSubmission();
          newSubmission.isPublish = payload.isPublish;
          newSubmission.quiz = quizDetails;
          newSubmission.student = studentDetails;
          newSubmission.status = QuizStatusType.NOT_ATTEMPTED;
          newSubmission.session = sessionDetails;
          return this.quizSubmissionRepo.save(newSubmission);
        }
      });

      await Promise.all(quizSubmissionPromises);
    }

    await this.quizRepo.save(quizDetails);
  }

  async editQuestion(id: string, payload: EditQuizQuestion) {
    const questionDetails = await this.quizQuestionRepo.findOne({
      where: { id },
    });
    if (!questionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'questionId is Invalid');

    questionDetails.question = payload.question;
    questionDetails.correctAnswer = payload.correctAnswer;
    questionDetails.options = payload.options;
    await this.quizQuestionRepo.save(questionDetails);
  }

  async quizResult(resultDto: ResultDto): Promise<any> {
    const quizDetails: any = await this.quizRepo.findOne({
      where: { id: resultDto.quizId },
      relations: ['quizes'],
    });
    const resultStats = await this.quizSubmissionRepo.findOne({
      where: { id: resultDto.submissionId },
      select: ['obtainMarks', 'totalMarks'],
    });
    quizDetails.obtainMarks = resultStats.obtainMarks;
    quizDetails.totalMarks = resultStats.totalMarks;
    if (!quizDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Quiz not found');
    return quizDetails;
  }
}
