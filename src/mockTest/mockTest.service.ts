import { HttpCode, HttpStatus, Injectable } from '@nestjs/common';
import { Any, Repository, Transaction } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMockTestCategoryDto } from './dto/create-mockTest-category.dto';
import { CreateMockTestDto, MockTestQuestion } from './dto/create-mockTest.dto';
import { TakeMockTestDto } from './dto/take-mockTest.dto';
import { MockTestCategory } from './entities/mock-test-category.entity';
import { MockTest } from './entities/mock-test.entity';
import { MockTestQuery } from './dto/query-mockTest.dto';
import HttpException from '@utils/exceptions/HttpException';
import { MockTestQuestionEntity } from './entities/mock-test-question.entity';
import { SearchMockTestDto } from './dto/search-test.dto';
import { query } from 'express';
import * as moment from 'moment';
import { EditMockTest, EditQuestion } from './dto/edit-mockTest.dto';
import { MockTestAnswerDto } from './dto/result-mockTest.dto';
import { QuizQuestion } from 'quiz/dto/create-quiz.dto';
import { slugConversation } from '@utils/slugName';
import { SlugDto } from '@courses/interfaces/course.interface';
import { QuizQuestionEntity } from 'quiz/entities/question-quiz.entity';
import { throws } from 'assert';
import { shuffle } from 'lodash';

// interface MockTestResponse {
//   totalMockCount: number;
//   totalAnswerdMockTest: number;
//   data: MockTest[];
// }
@Injectable()
export class MockTestService {
  constructor(
    @InjectRepository(MockTest) private mockTestRepo: Repository<MockTest>,
    @InjectRepository(MockTestQuestionEntity)
    private mockTestQuestionRepo: Repository<MockTestQuestionEntity>,
    @InjectRepository(MockTestCategory)
    private mockTestCategoryRepo: Repository<MockTestCategory>,
  ) {}

  /*
   * MockTest-Category CRUD
   */

  async createMockTestCategory(payloadData: CreateMockTestCategoryDto) {
    const mockCategory = this.mockTestCategoryRepo.create(payloadData);
    return await this.mockTestCategoryRepo.save(mockCategory);
  }

  async findAllMockTestCategory() {
    return await this.mockTestCategoryRepo.find();
  }

  /*
   * MockTest CRUD
   */

  async createMockTest(payload: MockTestQuestion) {
    const { questions } = payload;
    if (!questions.length)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'questions not found');
    const mockTestCategory = await this.mockTestCategoryRepo.findOne({
      where: { id: payload.categoryId },
    });

    if (!mockTestCategory)
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        'Mock test category not found',
      );

    return this.mockTestRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const mockTest = new MockTest();
        mockTest.name = payload.name;
        mockTest.description = payload.description;
        mockTest.image = payload.image;
        mockTest.duration = payload.duration;
        mockTest.slugName = slugConversation(payload.name);
        mockTest.mockTestCategory = mockTestCategory;
        mockTest.metaTags = payload.metaTags;
        mockTest.metaTitle = payload.metaTitle;
        mockTest.numberOfQuestions = questions.length;
        mockTest.metaDescription = payload.metaDescription;
        const mockTestDetails = await transactionalEntityManager.save(mockTest);

        const questionObject: Array<Object> = [];
        for (let i = 0; i < questions.length; i++) {
          const mockQuestions = {
            question: questions[i].question,
            mockTest: mockTestDetails,
            options: questions[i].options,
            correctAnswer: questions[i].correctAnswer,
            questionNo: i + 1,
          };
          questionObject.push(mockQuestions);
        }

        const mockTestQuestions = await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(MockTestQuestionEntity) // Replace with your MockTestQuestionEntity class name
          .values(questionObject)
          .execute();

        // You can return the created mock test details if needed
        return mockTestDetails;
      },
    );
  }

  async mockTestList(payloadData: SearchMockTestDto): Promise<{
    mockTests: MockTest[];
    total: number;
    totalAnswerMockTests: number;
  }> {
    const { date } = payloadData;
    const limit = payloadData.pageLength < 1 ? 1 : payloadData.pageLength || 10;
    const page = payloadData.pageNo < 1 ? 1 : payloadData.pageNo || 1;
    const currentDate: Date = new Date();
    const mockTestsQuery = this.mockTestRepo
      .createQueryBuilder('mockTest')
      .leftJoinAndSelect('mockTest.questions', 'questions')
      .leftJoinAndSelect('mockTest.mockTestCategory', 'mockTestCategory')
      .orderBy('mockTest.createdDate', 'DESC');

    if (payloadData.testName) {
      mockTestsQuery.where('mockTest.name ILike :name', {
        name: `%${payloadData.testName}%`,
      });
    }
    if (payloadData.categoryId) {
      mockTestsQuery.andWhere('mockTestCategory.id =:categoryId', {
        categoryId: payloadData.categoryId,
      });
    }
    if (date) {
      const startDate = moment(date.toString(), 'YYYY-MM-DD')
        .startOf('day')
        .toDate();
      const endDate = moment(date.toString(), 'YYYY-MM-DD')
        .endOf('day')
        .toDate();
      mockTestsQuery.andWhere(
        date
          ? 'mockTest.lastModifiedDate BETWEEN :startDate AND :endDate'
          : '1=1',
        { startDate, endDate },
      );
    }
    const answerCountPromise = this.mockTestRepo.query(
      `select sum(mt."answerCount") as count from "mock-test" as mt`,
    );

    const [[mockTests, total], answerCount] = await Promise.all([
      mockTestsQuery
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount(),
      // this.mockTestRepo.count(),
      answerCountPromise,
    ]);

    return {
      mockTests,
      total,
      totalAnswerMockTests: +answerCount?.[0]?.count,
    };
  }

  async mockTestList2(payloadData: SearchMockTestDto): Promise<{
    updatedmockTests: MockTest[];
    total: number;
    totalAnswerMockTests: number;
  }> {
    const { date } = payloadData;
    const limit = payloadData.pageLength < 1 ? 1 : payloadData.pageLength || 10;
    const page = payloadData.pageNo < 1 ? 1 : payloadData.pageNo || 1;

    const mockTestsQuery = this.mockTestRepo
      .createQueryBuilder('mockTest')
      .leftJoinAndSelect('mockTest.questions', 'questions')
      .leftJoinAndSelect('mockTest.mockTestCategory', 'mockTestCategory');

    if (payloadData.testName) {
      mockTestsQuery.where('mockTest.name ILike :name', {
        name: `%${payloadData.testName}%`,
      });
    }
    if (payloadData.categoryId) {
      mockTestsQuery.andWhere('mockTestCategory.id =:categoryId', {
        categoryId: payloadData.categoryId,
      });
    }
    if (date) {
      const startDate = moment(date.toString(), 'YYYY-MM-DD')
        .startOf('day')
        .toDate();
      const endDate = moment(date.toString(), 'YYYY-MM-DD')
        .endOf('day')
        .toDate();
      mockTestsQuery.andWhere(
        date
          ? 'mockTest.lastModifiedDate BETWEEN :startDate AND :endDate'
          : '1=1',
        { startDate, endDate },
      );
    }

    const [mockTests, total] = await Promise.all([
      mockTestsQuery
        .take(limit)
        .skip((page - 1) * limit)
        .getMany(),
      this.mockTestRepo.count(),
    ]);

    const updatedmockTests = mockTests.filter((i) => {
      return i.mockTestCategory.id != payloadData.categoryId;
    });

    return { updatedmockTests, total, totalAnswerMockTests: 10 };
  }

  async removeMockTest(id: string) {
    const testDetails = await this.mockTestRepo.findOne({ where: { id } });
    if (!testDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'mock test not found');
    const testPromise = this.mockTestRepo.softDelete({ id });
    const questionPromise = this.mockTestQuestionRepo.softDelete({
      mockTest: { id },
    });
    await Promise.all([testPromise, questionPromise]);
  }
  async removeQuestion(id: string) {
    const questionDetails = await this.mockTestQuestionRepo.findOne({
      where: { id },
      relations: { mockTest: true },
    });
    const test = questionDetails.mockTest;
    test.numberOfQuestions -= 1;
    await this.mockTestRepo.save(test);
    if (!questionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'question not found');
    await this.mockTestQuestionRepo.softDelete({ id });
  }

  async findTest(id: string): Promise<MockTest> {
    const testDetails = await this.mockTestRepo.findOne({
      where: { id },
      relations: ['questions', 'mockTestCategory'],
      order: { questions: { questionNo: 'ASC' } },
    });
    if (!testDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'mock test not found');
    return testDetails;
  }

  async editTest(id: string, payload: EditMockTest) {
    const testDetails = await this.mockTestRepo.findOne({ where: { id } });
    if (!testDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'mock test not found');

    testDetails.image = payload.image;
    testDetails.name = payload.name;
    testDetails.description = payload.description;
    testDetails.duration = payload.duration;
    testDetails.metaDescription = payload.metaDescription;
    testDetails.metaTitle = payload.metaTitle;
    testDetails.metaTags = payload.metaTags;
    if (payload.categoryId) {
      const mockTestCategoryDetails = await this.mockTestCategoryRepo.findOne({
        where: { id: payload.categoryId },
      });
      if (!mockTestCategoryDetails)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid categoryId');
      testDetails.mockTestCategory = mockTestCategoryDetails;
    }
    await this.mockTestRepo.save(testDetails);
  }

  async editQuestion(id: string, payload: EditQuestion) {
    const questionDetails = await this.mockTestQuestionRepo.findOne({
      where: { id },
    });
    if (!questionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'questionId is Invalid');

    questionDetails.question = payload.question;
    questionDetails.correctAnswer = payload.correctAnswer;
    questionDetails.options = payload.options;
    await this.mockTestQuestionRepo.save(questionDetails);
  }

  async mockResult(
    id: string,
    payload: MockTestAnswerDto,
  ): Promise<{
    totalMarks: number;
    correctAnswers: number;
    totalQuestions: number;
    quiz: any;
    userAnswers: any;
  }> {
    let totalMarks = 0;
    let quizResult: Array<Object> = [];
    let correctAnswers = 0;
    const mockTestDetials = await this.mockTestRepo.findOne({ where: { id } });
    if (!mockTestDetials)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid mockTest id');
    const questionDetails = await this.mockTestQuestionRepo.find({
      where: { mockTest: { id } },
      select: ['id', 'correctAnswer', 'question', 'options'],
    });
    if (!questionDetails.length)
      throw new HttpException(
        HttpStatus.BAD_GATEWAY,
        'This test is not have questions',
      );
    if (!payload.quizAnswer.length) {
      return {
        totalMarks,
        correctAnswers,
        totalQuestions: questionDetails.length,
        quiz: questionDetails,
        userAnswers: [],
      };
    }

    for (const userAnswer of payload.quizAnswer) {
      const quizAnswer = questionDetails.find(
        (quiz) => quiz.id === userAnswer.questionId,
      );
      quizResult.push(quizAnswer);
      if (quizAnswer && userAnswer.answer === quizAnswer.correctAnswer) {
        correctAnswers++;
        totalMarks += 1; // Each correct answer is worth 2 marks
      }
    }
    mockTestDetials.answerCount += 1;
    await this.mockTestRepo.save(mockTestDetials);
    return {
      totalMarks,
      correctAnswers,
      totalQuestions: payload.quizAnswer.length,
      quiz: quizResult,
      userAnswers: payload.quizAnswer,
    };
  }

  async addQuestion(
    testId: string,
    payload: CreateMockTestDto,
  ): Promise<MockTestQuestionEntity> {
    const testDetails = await this.mockTestRepo.findOne({
      where: { id: testId },
    });
    if (!testDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'mock test not found');
    const lastQuestion = await this.mockTestQuestionRepo.findOne({
      where: {},
      order: { questionNo: 'DESC' },
    });
    testDetails.numberOfQuestions += 1;
    await this.mockTestRepo.save(testDetails);
    const newQuestion = new MockTestQuestionEntity();
    newQuestion.correctAnswer = payload.correctAnswer;
    newQuestion.question = payload.question;
    newQuestion.options = payload.options;
    newQuestion.correctAnswer = payload.correctAnswer;
    newQuestion.questionNo = lastQuestion ? lastQuestion.questionNo + 1 : 1;
    newQuestion.mockTest = testDetails;
    return await this.mockTestQuestionRepo.save(newQuestion);
  }

  async mockTestQuestions(payload: SlugDto): Promise<MockTest> {
    const filterObject: Object = {};
    payload.id
      ? (filterObject['id'] = payload.id)
      : (filterObject['slugName'] = payload.name);
    let mockTestDetails = await this.mockTestRepo.findOne({
      where: filterObject,
      relations: ['questions', 'mockTestCategory'],
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        metaTags: true,
        metaTitle: true,
        metaDescription: true,
        questions: {
          question: true,
          options: true,
          id: true,
        },
        mockTestCategory: {
          id: true,
          name: true,
        },
      },
    });
    if (mockTestDetails && mockTestDetails.questions) {
      mockTestDetails.questions = shuffle(mockTestDetails.questions);
      mockTestDetails.questions = mockTestDetails.questions.slice(0, 15);
    }
    return mockTestDetails;
    //const query = `select mt."name", mt."id" ,mt."description", mtq."question" FROM "mock-test" mt  join "mock-test-category" mtc on mt."mockTestCategoryId" =mtc.id join "mock-test-questions" mtq on mtq."mockTestId" = mt."id" where mt."slugName" =$1   `;
    //return await this.mockTestRepo.query(query, [payload.name]);
  }
}
