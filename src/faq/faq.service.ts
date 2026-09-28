import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FAQ } from './entities/faq.entity';
import { Repository } from 'typeorm';
import { FaqType } from '@utils/enum';
import { CreateFaqDTO } from './dtos/create-faq.dto';
import HttpException from '@utils/exceptions/HttpException';
@Injectable()
export class FaqService {
  constructor(@InjectRepository(FAQ) private faqRepo: Repository<FAQ>) {}

  async createFaq(payload: CreateFaqDTO) {
    await this.faqRepo.delete({ type: payload.type });

    for (let i = 0; i < payload.faq.length; i++) {
      const faq = new FAQ();

      faq.type = payload.faq[i].type;
      faq.questionNo = parseInt(payload.faq[i].questionNo);
      faq.question = payload.faq[i].question;
      faq.answer = payload.faq[i].answer;
      faq.isActive = payload.faq[i].isActive;

      const createFaq = this.faqRepo.create(faq);
      await this.faqRepo.save(createFaq);
    }
  }

  /* NOT REQUIRED

  async updateFaq(id: string, payload: UpdateFaqDTO) {
    const findFaq = await this.faqRepo.findOne({
      where: { id: id, type: payload.type },
    });

    if (!findFaq) throw new HttpException(404, 'Faq not found');

    findFaq.questionNo = payload.questionNo
      ? parseInt(payload?.questionNo)
      : findFaq.questionNo;
    findFaq.question = payload?.question;
    findFaq.answer = payload?.answer;
    findFaq.type = payload.type;
    findFaq.isActive = payload?.isActive;

    await this.faqRepo.save(findFaq);
  }

  */

  async softDeleteFaq(id: string) {
    const findFaq = await this.faqRepo.findOne({
      where: { id: id },
    });

    if (!findFaq) throw new HttpException(404, 'Faq not found');

    await this.faqRepo.softDelete(findFaq.id);
  }

  async commonFaq() {
    const faqsPromise = this.faqRepo.find({
      where: { type: FaqType.COMMON },
      order: { questionNo: 'ASC' },
    });

    const totalFaqPromise = this.faqRepo.count({
      where: { type: FaqType.COMMON },
    });

    const totalActivePromise = this.faqRepo.count({
      where: [{ type: FaqType.COMMON, isActive: true }],
    });

    const totalInActivePromise = this.faqRepo.count({
      where: [{ type: FaqType.COMMON, isActive: false }],
    });

    const [faqs, totalFaqs, totalActive, totalInActive] = await Promise.all([
      faqsPromise,
      totalFaqPromise,
      totalActivePromise,
      totalInActivePromise,
    ]);
    return { faqs, totalFaqs, totalActive, totalInActive };
  }

  async trainerFaq() {
    const faqsPromise = this.faqRepo.find({
      where: { type: FaqType.TRAINER },
      order: { questionNo: 'ASC' },
    });

    const totalFaqPromise = this.faqRepo.count({
      where: { type: FaqType.TRAINER },
    });

    const totalActivePromise = this.faqRepo.count({
      where: [{ type: FaqType.TRAINER, isActive: true }],
    });

    const totalInActivePromise = this.faqRepo.count({
      where: [{ type: FaqType.TRAINER, isActive: false }],
    });

    const [faqs, totalFaqs, totalActive, totalInActive] = await Promise.all([
      faqsPromise,
      totalFaqPromise,
      totalActivePromise,
      totalInActivePromise,
    ]);
    return { faqs, totalFaqs, totalActive, totalInActive };
  }

  async studentFaq() {
    const faqsPromise = this.faqRepo.find({
      where: { type: FaqType.STUDENT },
      order: { questionNo: 'ASC' },
    });

    const totalFaqPromise = this.faqRepo.count({
      where: { type: FaqType.STUDENT },
    });

    const totalActivePromise = this.faqRepo.count({
      where: [{ type: FaqType.STUDENT, isActive: true }],
    });

    const totalInActivePromise = this.faqRepo.count({
      where: [{ type: FaqType.STUDENT, isActive: false }],
    });

    const [faqs, totalFaqs, totalActive, totalInActive] = await Promise.all([
      faqsPromise,
      totalFaqPromise,
      totalActivePromise,
      totalInActivePromise,
    ]);
    return { faqs, totalFaqs, totalActive, totalInActive };
  }
}
