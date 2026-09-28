export enum RoleType {
  ADMIN = 'Admin',
  SUB_ADMIN = 'Sub_admin',
  TRAINER = 'Trainer',
  STUDENT = 'Student',
}

export enum PermissionType {
  BATCH = 'Batch',
  USER_MANAGEMENT = 'User Management',
  COURSES = 'Courses',
  CALENDER = 'Calendar',
  ROI = 'ROI & Reports',
  DASHBOARD = 'Dashboard',
  BlOGS = 'Blogs & More',
  WEBINARS = 'Webinars',
  ANNOUNCEMENT = 'Announcement',
  COMMON = 'Common FAQs',
  CAREERS = 'Careers',
  REFERRAL_OFFERS = 'Referral & Offers',
}

export enum AccessType {
  READ = 'Read',
  WRITE = 'Write',
}

export enum SkillLevel {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum EarningType {
  PER_PAX = 'Per_Pax',
  PER_HOUR = 'Per_Hour',
}

export enum TrainerEarningType {
  PER_PAX = 'Per_Pax',
  PER_HOUR = 'Per_Hour',
  PER_BATCH = 'Per_Batch',
}

export enum enrollmentType {
  ENROLLED = 'ENROLLED',
  NOT_ENROLLED = 'NOT_ENROLLED',
}

// export enum BatchType {
//   WEEKENDBATCH = 'WEEKENDBATCH',
// }

export enum StudentType {
  CORPORATE = 'Corporate',
  INDIVIDUAL = 'Individual',
}

export enum ClassRoomType {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
}

export enum Platform {
  GOOGLE_MEET = 'Google_Meet',
  TEAMS = 'Teams',
}

export enum FeeType {
  PER_INDIVIDUAL = 'Per_Individual',
  PER_PAX = 'Per_Pax',
  PER_BATCH = 'Per_Batch',
}

export enum SessionType {
  WEEKEND = 'Weekend',
  WEEKDAY = 'WeekDay',
  CUSTOM = 'Custom',
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum BlogType {
  Tutorial = 'TUTORIAL',
  Article = 'ARTICLE',
  Interview = 'INTERVIEW',
}

export enum LevelType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum BatchStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  CLOSED = 'CLOSED',
}

export enum PermissionAction {
  READ = 'Read',
  WRITE = 'Write',
}

export enum LeadsStatus {
  NEW = 'New',
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  CONVERTED = 'Converted',
  LOST = 'Lost',
}

export enum LeadsCategory {
  COURSEADVISOR = 'COURSE_ADVISOR',
  COURSEENQUIRY = 'COURSE_ENQUIRY',
  CONTACT_US = 'CONTACT_US',
}

export enum CorporateLeadCategory {
  COURSE_ENQUIRY = 'COURSE_ENQUIRY',
  CORPORATE_TRAINING = 'CORPORATE_TRAINING',
  CLOUD_LABS = 'CLOUD_LABS',
}

export enum CorporateLeadStatus {
  NEW = 'NEW',
  IN_PROCESS = 'IN_PROCESS',
  WON = 'WON',
  LOST = 'LOST',
}

export enum LeadTrainerStatus {
  TODO = 'TODO',
  SEARCHING = 'SEARCHING',
  FOUND = 'FOUND',
}

export enum AnnouncementTo {
  TRAINERS = 'Trainers',
  STUDENTS = 'Students',
  SUB_ADMINS = 'Sub_Admin',
  BATCH = 'Batch',
}
export enum QueryType {
  Lead = 'LEAD',
  HelpDesk = 'HELPDESK',
}

export enum QueryCategory {
  ACCOUNT = 'Account',
  LMS = 'LMS',
  COURSE = 'Course',
  TECHNICAL = 'Technical',
  TALK_TO_ADVISOR = 'Talk to advisor',
}

export enum TrainerQueryCategory {
  GENERAL_INFO = 'General Information',
  COURSE_RELATED = 'Course Related',
}

export enum TrainerQueryStatus {
  NEW = 'New',
  PROCESSING = 'Processing',
  RESOLVED = 'Resolved',
  OPENDED = 'Opened', // dont show on frontend
}

export enum InvoiceQueryCategory {
  WEBINAR = 'Webinar',
  COURSE = 'Course',
}
export enum InvoiceQueryStatus {
  NEW = 'New',
  RAISED = 'Raised',
  PROCESSING = 'Processing',
  REJECTED = 'Rejected',
  RESOLVED = 'Resolved',
  OPENDED = 'Opened', // dont show on frontend
}

export enum HelpQueryType {
  GENERAL_INFO = 'General Information',
  COURSE_RELATED = 'Course Related',
}

export enum TrainerCostType {
  PER_PAX = 'Per Pax',
  PER_HOUR = 'Per Hour',
  PER_DAY = 'Per Day',
  HALF_DAY = 'Half Day',
}

export enum ResourceType {
  RECORDING = 'RECORDING',
  STUDY_MATERIAL = 'STUDY MATERIAL',
  LINKS = 'LINKS',
  ASSIGNMENT = 'ASSIGNMENT',
}

export enum QuizStatusType {
  ATTEMPTED = 'Attempted',
  NOT_ATTEMPTED = 'Not Attempted',
}

export enum JobType {
  FULL_TIME = 'Full_Time',
  PART_TIME = 'Part_Time',
  INTERN = 'Intern',
}

export enum LearningObjectiveEnum {
  CERTIFICATION = 'Certification',
  TO_FIND_BETTER_JOB = 'To find better job',
  GROWTH = 'Growth in current job',
  LEARNING = 'Learning',
}

export enum GenderEnum {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Others',
}

export enum TrainingFundedEnum {
  SELF = 'Self',
  ORGANIZATION = 'Organization',
}

export enum QualificationEnum {
  HIGH_SCHOOL = 'High School Diploma',
  ASSOCIATE = "Associate's Degree",
  BACHELOR = "Bachelor's Degree",
  MASTERS = "Master's Degree",
  DOCTORATE = 'Doctorate/Ph.D',
  CERTIFICATION = 'Professional Certification',
}

export enum PositionStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
}

export enum HelpDeskStatus {
  RESOLVED = 'Resolved',
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  NEW = 'New',
}
export enum JobStatus {
  NEW = 'New',
  OPENDED = 'Opened',
  SHORT_LISTED = 'Short_Listed',
  REJECTED = 'Rejected',
  HIRED = 'Hired',
}

export enum TechCallEnum {
  SUCCESS = 'Success',
  FAILED = 'Failed',
  PENDING = 'Pending',
}

export enum AssignmentEnum {
  SUBMITTED = 'Submitted',
  PENDING = 'Pending',
}

export enum FaqType {
  COMMON = 'Common',
  TRAINER = 'Trainer',
  STUDENT = 'Student',
}
export enum ReferralCouponStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum QuestionType {
  MCQ = 'Mcq',
  RATING = 'Rating',
  COMMENTS = 'Comments',
}
export enum FeedBackType {
  POST_SESSION = 'Post Session',
  PRE_COURSE = 'Pre Course',
  POST_COURSE = 'Post Course',
}

export enum RewardCouponStatus {
  REDEEMED = 'Redeemed',
  INACTIVE = 'Inactive',
  EXPIRED = 'Expired',
  TOBEREDEEMED = 'To be redeemed',
}

export enum PaymentStatusEnum {
  PAID = 'Paid',
  CREATED = 'Created',
  FAILED = 'Failed',
}

export enum GatewayEnum {
  RAYZOR = 'Rayzorpay',
  STRIPE = 'Stripe',
}

export enum SlugFilter {
  COURSE = 'Course',
  BLOG = 'Blog',
  WEBINAR = 'Webinar',
  CATEGORY = 'Category',
}

export enum FormNameEnum {
  TALK_TO_ADVISOR = 'talkToAnAdvisor',
  CONNECT_WITH_ADVISOR = 'Connect With a Course Advisor',
  CERTIFICATION = 'Get your skills Certified',
  REQUEST_BATCH = 'Request a batch',
  CORPORATE = 'For Corporates',
  BOOK_A_LAB = 'Book A Lab',
  DOWNLOAD_SYLLABUS_FORM = 'Download Syllabus Form',
  CONTACT_US = 'Contact Us',
  GET_QUOTE = 'Ask For Quote',
  UPSKILL = 'Upskill your Team form',
  INQUIRE_BLOGS = 'Inquire want to know more',
  REQUST_FOR_LAB = 'Request For a Lab',
  TALK_TO_US = 'TalkToUs',
  WANT_MORE_DETAILS = 'Want More Details?',
  BOOK_A_DEMO = 'BOOK A DEMO',
}

export enum RazorpayEventEnum {
  Captured = 'payment.captured',
  Failed = 'payment.failed',
  Downtime_Start = 'payment.downtime.started',
  Downtime_End = 'payment.downtime.resolved',
}

export enum BatchTypeEnum {
  LIVE = 'Live',
  SELF = 'Self',
}
