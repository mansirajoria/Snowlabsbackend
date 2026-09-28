import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '@payment/entities/payment.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { DateFilterDTO } from './dto/date-filter.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RoiService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,
    @InjectRepository(Webinar)
    private readonly webinarRepo: Repository<Webinar>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    private readonly configService: ConfigService,
  ) {}

  async analytics(payload: DateFilterDTO) {
    const { month, year } = payload;

    const { startDate, endDate } = this.dateMaker(month, year);

    // INR
    // console.log(startDate, endDate);
    const courseEarnQuery = ` select p.total as "total" from payment p where 
                              p.currency = 'INR' and
                              p."paymentStatus" = 'paid' and
                              p."createdDate" > $1 and p."createdDate" < $2`;
    const courseEarningsPromise = this.paymentRepo.query(courseEarnQuery, [
      startDate,
      endDate,
    ]);

    // Other than INR currency
    const courseEarnQueryOther = ` select p.total as "total" from payment p where 
                              p.currency <> 'INR'and
                              p."paymentStatus" = 'paid' and
                              p."createdDate" > $1 and p."createdDate" < $2`;
    const courseEarningsOtherPromise = this.paymentRepo.query(
      courseEarnQueryOther,
      [startDate, endDate],
    );

    const webinarExpensesPromise = 'WIP'; // we need a table where we are paying out the money to trainer for their bill of webinar as WEBINAR Expenses

    // Top3 Array
    const top3query = `select c.id as "CourseId", c."courseName", sum(p.total) as "earnings" from course c 
                       join payment p on c.id = p."courseId" 
                       where p."createdDate" > $1 and p."createdDate" < $2 and p."paymentStatus" ='paid' and p.currency = 'INR'
                       group by c.id ,c."courseName" 
                       order by "earnings" desc 
                       limit 3`;
    const top3EarningCoursesPromise = this.courseRepo.query(top3query, [
      startDate,
      endDate,
    ]);

    const [
      courseEarnings,
      courseEarningsOther,
      webinarExpenses,
      top3EarningCourses,
    ] = await Promise.all([
      courseEarningsPromise,
      courseEarningsOtherPromise,
      webinarExpensesPromise,
      top3EarningCoursesPromise,
    ]);

    const dollerEarningCalculation =
      courseEarningsOther[0]['total'] *
      (Number(this.configService.get('payment.gst', { infer: true })) || 80);

    return {
      courseEarnings:
        courseEarnings[0]['total'] + dollerEarningCalculation || 'N/A',
      webinarExpenses,
      certificationEarnings: 'WIP',
      top3EarningCourses,
    };
  }

  async courseAnalytics(payload: DateFilterDTO) {
    const { month, year } = payload;

    const { startDate, endDate } = this.dateMaker(month, year);

    // Domestic
    const domesticQuery = `
    select sum(p.total) as "dom" from payment as p where 
    p.currency = 'INR' and
    p."paymentStatus" = 'paid' and
    p."batchId" is not null and
    p."createdDate" > $1 and p."createdDate" < $2
    `;

    const domesticRevenuePromise = this.paymentRepo.query(domesticQuery, [
      startDate,
      endDate,
    ]);

    // International
    const internationalQuery = `
    select sum(p.total) as "inter" from payment as p where 
    p.currency <> 'INR' and
    p."paymentStatus" = 'paid' and
    p."batchId" is not null and
    p."createdDate" > $1 and p."createdDate" < $2
    `;

    const internationalRevenuePromise = this.paymentRepo.query(
      internationalQuery,
      [startDate, endDate],
    );

    // Expense Calculation
    const gstTotalQuery = `
    select sum(p.tax) as "gst" from payment as p where
    p.currency = 'INR' and
    p."paymentStatus" = 'paid' and 
    p."createdDate" > $1 and p."createdDate" < $2
    `;
    const gstTotalPromise = this.paymentRepo.query(gstTotalQuery, [
      startDate,
      endDate,
    ]);

    const domesticGatewayChargesQuery = `
    select sum(p."gatewayCharges") as "charges" from payment as p where
    p."paymentStatus" = 'paid' and 
    p.currency = 'INR' and
    p."createdDate" > $1 and p."createdDate" < $2
    `;
    const domesticGatewayChargesPromise = this.paymentRepo.query(
      domesticGatewayChargesQuery,
      [startDate, endDate],
    );

    const internationalGatewayChargesQuery = `
    select sum(p."gatewayCharges") as "charges" from payment as p where
    p."paymentStatus" = 'paid' and 
    p.currency <> 'INR' and
    p."createdDate" > $1 and p."createdDate" < $2
    `;

    const internationalGatewayChargesPromise = this.paymentRepo.query(
      internationalGatewayChargesQuery,
      [startDate, endDate],
    );

    // trainer expenses pending

    const labCostQuery = `
    select sum(b."labCost") as "labcost" from batch as b where
    b."startDate" >= $1 and
    b."endDate" <= $2
    `;
    const labCostPromise = this.batchRepo.query(labCostQuery, [
      startDate,
      endDate,
    ]);

    // Type Distribuition

    // live

    const liveQuery = `
    SELECT SUM(
      CASE 
          WHEN p."paymentStatus" = 'paid' AND p.currency = 'USD' THEN p.total * $1
          ELSE p.total
      END
    ) AS live
    FROM payment p
    WHERE p."paymentStatus" = 'paid' and
    p."createdDate" > $2 and p."createdDate" < $3
    `;
    const liveBatchPromise = this.paymentRepo.query(liveQuery, [
      Number(this.configService.get('payment.gst', { infer: true })) || 80,
      startDate,
      endDate,
    ]);

    const expenseDistributionQuery = `
    with roiData as (select c."courseName" ,b."batchId", 
    sum(p.total) as "earnings" ,
    sum(p.tax) as "gst",
    case
       when tc."feesType" ='Per_Pax' then (count(p.id) * tc."inrAmount")
       when tc."feesType" ='Per_Hour' then (count(s.id)  * b."totalDuration" * tc."inrAmount")
       when tc."feesType" ='Per_Batch' then (count(b.id) * tc."inrAmount")
    end as "trainerCost"
    from payment p  
    join batch b on p."batchId" =b.id join course c on b."courseId" =c.id join "trainer-cost" tc on b."costId" =tc.id 
    join trainer t on b."trainerId" =t.id left join "session" s on b.id =s."batchId"  and tc."feesType" = 'Per_Hour'  where  p."createdDate" > $1 and p."createdDate" < $2 and p."paymentStatus" ='paid' and  p.currency = 'INR' and c."courseName" ILIKE $3 limit $4 offset $5
    group by c."courseName", b."batchId",tc."feesType", tc."inrAmount", b."totalDuration") select "earnings","gst","trainerCost",("earnings" -"trainerCost") as "roi", "courseName","batchId" from roiData   
    `;

    const limit = payload.pageLength < 1 ? 1 : payload.pageLength || 10;
    const page = payload.pageNo < 1 ? 1 : payload.pageNo || 1;

    const expenseDistributionPromise = this.courseRepo.query(
      expenseDistributionQuery,
      [
        startDate,
        endDate,
        `%${payload.keyword || ''}%`,
        limit,
        (page - 1) * limit,
      ],
    );

    const [
      domesticRevenue,
      internationalRevenue,
      gstTotal,
      domesticGatewayCharges,
      internationalGatewayCharges,
      labCost,
      liveBatch,
      expenseDistribution,
    ] = await Promise.all([
      domesticRevenuePromise,
      internationalRevenuePromise,
      gstTotalPromise,
      domesticGatewayChargesPromise,
      internationalGatewayChargesPromise,
      labCostPromise,
      liveBatchPromise,
      expenseDistributionPromise,
    ]);

    // Strictly filter out zero-earning records
    const filteredExpenseDistribution = expenseDistribution.filter((row) => Number(row.earnings) > 0);
    return {
      roi: 'WIP',
      domesticRevenue: Number(domesticRevenue[0]['dom']) || 'N/A',
      internationalRevenue: internationalRevenue[0]['inter'] * 80 || 'N/A',
      expenses: {
        GST: Number(gstTotal[0]['gst']) || 'N/A',
        gstvalue:
          Number(this.configService.get('payment.gst', { infer: true })) || 18,
        domesticGatewayCharges:
          Number(domesticGatewayCharges[0]['charges']) || 'N/A',
        internationalGatewayCharges:
          Number(internationalGatewayCharges[0]['charges']) || 'N/A',
        trainerCost: 'WIP',
        labCost: Number(labCost[0]['labcost']) || 'N/A',
      },
      typeDistribuition: {
        live: Number(liveBatch[0]['live']),
        self: 'WIP',
        one2one: 'WIP',
      },
      expenseDistribution: filteredExpenseDistribution,
    };
  }

  async batchAnalytics(payload: DateFilterDTO) {
    const { month, year } = payload;

    const { startDate, endDate } = this.dateMaker(month, year);

    const roiQuery = `
  select subquery.total - subquery.gatewayCharges - subquery.gstCharges as roi 
from (
  select 
    sum(p.total) as total, 
    sum(p."gatewayCharges") as gatewayCharges, 
    sum(p."tax") as gstCharges 
  from payment as p 
  where (p."paymentStatus" = 'paid' or p."paymentStatus" = 'captured') 
    and p."createdDate" >= $1 and p."createdDate" < $2
) as subquery

      `;
    const trainerEarningQuery = `
    with roiData as (
  select 
    case
      when tc."feesType" = 'Per_Pax' then (count(p.id) * tc."inrAmount")
      when tc."feesType" = 'Per_Batch' then (tc."inrAmount" * 1)
      when tc."feesType" = 'Per_Hour' then (b."totalDuration" * tc."inrAmount")
    end as "trainerCost",
    t."gstNumber"
  from payment p  
  join batch b on p."batchId" = b.id
  join course c on b."courseId" = c.id
  join "trainer-cost" tc on b."costId" = tc.id
  join trainer t on b."trainerId" = t.id
  where (p."paymentStatus" = 'paid' or p."paymentStatus" = 'captured') 
    and p."createdDate" >= $1 and p."createdDate" < $2
  group by p."courseId", p."batchId", p."total", p."tax", p."gatewayCharges", 
           b."trainerId", t."trainerId", b."batchId", tc."inrAmount", 
           t."gstNumber", tc."feesType", b."totalDuration", tc."id"
)
select sum( 
  case
    when "gstNumber" is not null then "trainerCost" + "trainerCost" * 0.18
    else "trainerCost"
  end
) as "TotalTrainerCost"
from roiData
`;

    const trainerEarningPromise = this.paymentRepo.query(trainerEarningQuery, [
      startDate,
      endDate,
    ]);

    const roiPromise = this.paymentRepo.query(roiQuery, [startDate, endDate]);

    const domesticRevenueQuery = `
   select cast(sum(p.total) as numeric(10,2)) as "dom"
from payment as p 
where p."currency" = 'INR' 
  and p."batchId" is not null 
  and (p."paymentStatus" = 'captured' or p."paymentStatus" = 'paid')
  and p."createdDate" >= $1 and p."createdDate" < $2
`;
    const domesticRevenuePromise = this.paymentRepo.query(
      domesticRevenueQuery,
      [startDate, endDate],
    );

    const internationalRevenueQuery = `
    select cast(sum(p.total) as numeric(10,2)) as "inter"
from payment as p 
where p."currency" = 'USD' 
  and p."batchId" is not null 
  and (p."paymentStatus" = 'captured' or p."paymentStatus" = 'paid')
  and p."createdDate" >= $1 and p."createdDate" < $2
 `;
    const internationalRevenuePromise = this.paymentRepo.query(
      internationalRevenueQuery,
      [startDate, endDate],
    );

    const limit = payload.pageLength < 1 ? 1 : payload.pageLength || 10;
    const page = payload.pageNo < 1 ? 1 : payload.pageNo || 1;
    const ls = `with rd as (
  select 
    sum(p."total") as "total", 
    sum(p."tax") as "tax", 
    sum(p."gatewayCharges") as "gatewayCharges", 
    c."courseName", b."batchId", a."fullName", 
    CASE 
      WHEN t."gstNumber" IS NOT NULL THEN 
          (
              CASE 
                  WHEN tc."feesType" = 'Per_Batch' THEN (tc."inrAmount" * 1)
                  WHEN tc."feesType" = 'Per_Pax' THEN (tc."inrAmount" * COUNT(p.id))
                  WHEN tc."feesType" = 'Per_Hour' THEN (tc."inrAmount" * b."totalDuration")
              END
          ) * 0.18 + (
              CASE 
                  WHEN tc."feesType" = 'Per_Batch' THEN (tc."inrAmount" * 1)
                  WHEN tc."feesType" = 'Per_Pax' THEN (tc."inrAmount" * COUNT(p.id))
                  WHEN tc."feesType" = 'Per_Hour' THEN (tc."inrAmount" * b."totalDuration")
              END
          )
      ELSE
         (
          CASE 
            WHEN tc."feesType" = 'Per_Batch' THEN (tc."inrAmount" * 1)
            WHEN tc."feesType" = 'Per_Pax' THEN (tc."inrAmount" * COUNT(p.id))
            WHEN tc."feesType" = 'Per_Hour' THEN (tc."inrAmount" * b."totalDuration")
         END
         )
    END AS "trainerCost",
    t."gstNumber"
  from payment p
  join batch b on b.id = p."batchId" 
  join "trainer-cost" tc on tc.id = b."costId"
  join course c on c.id = p."courseId"
  join trainer t on t.id = b."trainerId"
  join auth a on a.id = t."authId"
  where (b."batchId" ILIKE $1 OR c."courseName" ILIKE $1) 
    and p."createdDate" >= $2 and p."createdDate" < $3
  group by p."courseId", p."batchId", p."total", p."tax", p."gatewayCharges", 
           b."trainerId", a."fullName", c."courseName", t."trainerId", b."batchId", 
           tc."inrAmount", t."gstNumber", tc."feesType", b."totalDuration", tc."id"
  limit $4 offset $5
)
select 
  "courseName", 
  "batchId", 
  "fullName",
  rd."total" as "earnings", 
  rd."tax" as "gst",
  rd."trainerCost" as "trainerCost",
  cast(rd."gatewayCharges" as numeric(10,2)) as "gateway",
  cast((rd."total" - rd."trainerCost" - rd."gatewayCharges" - rd."tax") as numeric(10,2)) as roi 
from rd    
group by rd."batchId", rd."courseName", rd."fullName", rd."trainerCost", 
         rd."gatewayCharges", rd."total", rd."tax"
`;
    const expenseDistributionPromise = this.batchRepo.query(ls, [
      `%${payload.keyword || ''}%`,
      startDate,
      endDate,
      limit,
      (page - 1) * limit,
    ]);

    console.log(`%${payload.keyword || ''}%`);

    const expenseDistributionCountPromise = this.batchRepo.query(
      `
 SELECT COUNT(*) AS record_count
FROM (
  SELECT b.id AS "id", b."batchId"
  FROM batch b
  JOIN payment p ON p."batchId" = b.id
  JOIN course c ON c.id = b."courseId"
  WHERE p."createdDate" >= $1 AND p."createdDate" < $2
  GROUP BY b.id, c."courseName"
) AS subquery

    `,
      [startDate, endDate],
    );

    const [
      roi,
      trainerEarnings,
      domesticRevenue,
      internationalRevenue,
      expenseDistribution,
      count,
    ] = await Promise.all([
      roiPromise,
      trainerEarningPromise,
      domesticRevenuePromise,
      internationalRevenuePromise,
      expenseDistributionPromise,
      expenseDistributionCountPromise,
    ]);

    // Strictly filter out zero-earning records
    const filteredExpenseDistribution = expenseDistribution.filter((row) => Number(row.earnings) > 0);
    return {
      roi: (
        Number(roi[0]['roi']) - Number(trainerEarnings[0]['TotalTrainerCost'])
      ).toFixed(2),
      domestic: Number(domesticRevenue[0]['dom']).toFixed(2) || 0,
      international: Number(internationalRevenue[0]['inter']).toFixed(2),
      expenseDistribution: filteredExpenseDistribution,
      totalCount: Number(count[0]['record_count'])
        ? Number(count[0]['record_count'])
        : 0,
    };
  }

  async downloadBatchAnalytics(dateFilter: any) {
    const { startMonth, startYear, endMonth, endYear } = dateFilter;

    const { startDate, endDate } = this.dateMaker2(
      startMonth,
      startYear,
      endMonth,
      endYear,
    );

    const expenseDistributionQuery = `
    with roiData as (select c."courseName" ,b."batchId",
    sum(p.total) as "earnings" ,
    sum(p.tax) as "gst",
    case
       when tc."feesType" ='Per_Pax' then (count(p.id) * tc."inrAmount")
       when tc."feesType" ='Per_Hour' then (count(s.id)  * b."totalDuration" * tc."inrAmount")
       when tc."feesType" ='Per_Batch' then (count(b.id) * tc."inrAmount")
    end as "trainerCost"
    from payment p
    join batch b on p."batchId" =b.id join course c on b."courseId" =c.id join "trainer-cost" tc on b."costId" =tc.id
    join trainer t on b."trainerId" =t.id left join "session" s on b.id =s."batchId" where
    p."createdDate" > $1 and p."createdDate" < $2 and
    b."deletedAt" IS NULL and p."paymentStatus"='paid'
    group by c."courseName", b."batchId",tc."feesType", tc."inrAmount", b."totalDuration"
    ) select "earnings","gst","trainerCost",("earnings" -"trainerCost") as "roi", "courseName","batchId" from roiData;
    `;
    const expenseDistribution = await this.batchRepo.query(
      expenseDistributionQuery,
      [startDate, endDate],
    );

    // Strictly filter out zero-earning records
    const filteredExpenseDistribution = expenseDistribution.filter((row) => Number(row.earnings) > 0);
    return filteredExpenseDistribution;
  }

  dateMaker(month: any, year: any) {
    month = month ? month : moment().get('month');
    year = year ? year : moment().get('year');

    const startDate = new Date(
      moment(`01/${month}/${year}`, 'DD/MM/YYYY').startOf('months').toDate(),
    );

    const endDate = new Date(
      moment(`01/${month}/${year}`, 'DD/MM/YYYY').endOf('months').toDate(),
    );
    return { startDate, endDate };
  }

  dateMaker2(startMonth: any, startYear: any, endMonth: any, endYear: any) {
    const startDate = new Date(
      moment(`01/${startMonth}/${startYear}`, 'DD/MM/YYYY')
        .startOf('months')
        .toDate(),
    );

    const endDate = new Date(
      moment(`01/${endMonth}/${endYear}`, 'DD/MM/YYYY')
        .endOf('months')
        .toDate(),
    );

    return { startDate, endDate };
  }
}
