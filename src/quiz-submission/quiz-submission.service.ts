import { HttpStatus, Injectable } from '@nestjs/common';
import { QuizAnswerDto } from './dto/submit-quiz.dto';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempts } from './entities/quiz-attempts.entity';
import { QuizQuestionEntity } from 'quiz/entities/question-quiz.entity';
import HttpException from '@utils/exceptions/HttpException';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { QuizStatusType } from '@utils/enum';
import { AuthEntity } from '@auth/entities/auth.entity';
import { ListDto } from 'assignment-submission/dto/assignment.dto';
import { Student } from '@students/entities/student.entity';

@Injectable()
export class QuizSubmissionService {
  constructor(
    @InjectRepository(QuizSubmission)
    private quizSubmissionRepo: Repository<QuizSubmission>,
    @InjectRepository(AuthEntity)
    private authRepo: Repository<AuthEntity>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(QuizEntity)
    private quizRepo: Repository<QuizEntity>,
    @InjectRepository(QuizAttempts)
    private quizAttemptsRepo: Repository<QuizAttempts>,

    @InjectRepository(QuizQuestionEntity)
    private quizQuestionRepo: Repository<QuizQuestionEntity>,
  ) {}

  quizResult(totalMarks: number, obtainMarks: number): boolean {
    // Calculate the pass threshold as 33% of totalNumber
    const passThreshold = (33 / 100) * totalMarks;

    // Check if obtainNumber is greater than or equal to the pass threshold
    if (obtainMarks >= passThreshold) {
      return true;
    } else {
      return false;
    }
  }
  async submitQuiz(payload: QuizAnswerDto): Promise<any> {
    let totalMarks: number = 0;
    let correctAnswers: number = 0;
    const quizDetails = await this.quizRepo.findOne({
      where: { id: payload.quizId },
    });
    const studentDetials = await this.authRepo.findOne({
      where: { id: payload.authId },
    });
    if (!quizDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid quiz id');
    const quizQuestions = await this.quizQuestionRepo.find({
      where: { quiz: { id: payload.quizId } },
    });
    const submissionDetails = await this.quizSubmissionRepo.findOne({
      where: { id: payload.submissionId },
      relations: ['attempts'],
    });
    if (submissionDetails.numberOfAttempts == 3)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'number of  attetmpts are exceed',
      );
    if (!quizQuestions.length)
      throw new HttpException(
        HttpStatus.BAD_GATEWAY,
        'This quiz is not have questions',
      );
    if (payload.quizAnswer.length) {
      for (const userAnswer of payload.quizAnswer) {
        const quizAnswer = quizQuestions.find(
          (quiz) => quiz.id === userAnswer.questionId,
        );

        if (quizAnswer && userAnswer.answer === quizAnswer.correctAnswer) {
          correctAnswers++;
          totalMarks += 1; // Each correct answer is worth 2 marks
        }
      }
    }
    const newQuizAttempts = new QuizAttempts();
    newQuizAttempts.correctAnswers = correctAnswers;
    newQuizAttempts.obtainMarks = totalMarks;
    newQuizAttempts.totalMarks = quizQuestions.length * 1;
    newQuizAttempts.submission = submissionDetails;
    newQuizAttempts.quiz = quizDetails;
    newQuizAttempts.isPassed = this.quizResult(
      quizQuestions.length * 1,
      totalMarks,
    );

    submissionDetails.numberOfAttempts++;
    submissionDetails.status = QuizStatusType.ATTEMPTED;
    submissionDetails.obtainMarks =
      totalMarks > submissionDetails.obtainMarks
        ? totalMarks
        : submissionDetails.obtainMarks;
    submissionDetails.totalMarks = quizQuestions.length * 1;
    const [attemptsData, submissionData] = await Promise.all([
      this.quizAttemptsRepo.save(newQuizAttempts),
      this.quizSubmissionRepo.save(submissionDetails),
    ]);
    const quizSubmissionData = await this.quizSubmissionRepo.findOne({
      where: { id: payload.submissionId },
      relations: ['attempts'],
    });
    const quizResult: Object = {
      correctAnswers: attemptsData.correctAnswers,
      obtainMarks: attemptsData.obtainMarks,
      totalMarks: attemptsData.totalMarks,
      studentName: studentDetials.name,
      isPassed: attemptsData.isPassed,
    };
    return { quizResult, quizSubmissionData };
  }

  async getQuizzes(payload: ListDto): Promise<QuizSubmission[]> {
    const studentDetailsDetails = await this.studentRepo.findOne({
      where: { auth: { id: payload.authId } },
    });
    if (!studentDetailsDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid student');
    const quizzes = await this.quizSubmissionRepo.find({
      where: {
        student: { id: studentDetailsDetails.id },
        session: { id: payload.sessionId },
        isPublish: true,
      },
      relations: ['quiz', 'attempts'],
    });
    return quizzes;
  }
}
