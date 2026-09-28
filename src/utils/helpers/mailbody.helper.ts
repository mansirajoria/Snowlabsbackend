import { Webinar } from '@webinars/entities/webinar.entity';

export function getEnrollmentMailBody(payload: EnrollmentInterface) {
  const body = `
    <p>Dear ${payload.studentName || 'Learner'},</p>
    <p>Thank you for enrolling in the ${
      payload.courseName
    } at SnowLabs Technology. Your payment is successfully processed. Congratulations on taking this important step in your educational journey.</p>
    <p>Here are essential details regarding your enrollment:</p>
    <ol>
        <li>
            <p>Course Information</p>
            <ul>
                <li>Date – ${payload.startDate}</li>
                <li>Time – ${payload.startTime}
                </li>
                <li>Duration – ${payload.duration} hours</li>
            </ul>
        </li>
        <li>
            <p>Course Materials and Resources</p>
            <p>Our team will provide you with all the necessary course-related learning material, assignments, and other resources. You will get access to our online learning platform - LMS (Learning Management System).</p>
        </li>
        <li>
            <p>Session Invite</p>
            <p>Session invite will be shared with you on the registered email.</p>
        </li>
    </ol>
    <p>Keep an eye on your email inbox for an upcoming message with detailed instructions on how to access the course materials and online learning platform, session invite, and pre-assessment form to set the expectations with the trainer.</p>
    <p>This email will be sent to the address you provided during the enrollment process.</p>
    <p>We are thrilled to have you as part of our learning community and look forward to supporting you in achieving your academic and career goals. If you have any questions or require further assistance, please feel free to reach out to our program managers at <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a></p>
    <p>Phone: +91-9717594443, +91-7428334555</p>
    <p>Whatsapp: <a href="https://wa.link/c00r54">https://wa.link/c00r54</a>, <a href="https://wa.link/8v0eqa">https://wa.link/8v0eqa</a></p>
    <p>Thanks,</p>
    <p>Team – SnowLabs Technology</p>    
    `;

  return body;
}

export function getWebinarEnrollmentMailBody(
  payload: WebinarEnrollmentInterface,
) {
  return `<p>Dear <strong>${payload.name || 'Learner'}</strong>,</p>
  <p>We are delighted to confirm your registration for our upcoming webinar titled ${
    payload.title
  }. Thank you for expressing your interest in joining us for this informative and engaging session.</p>
  <p>Here are the details for the webinar:</p>
  <ul>
      <li><strong>Date:</strong> ${payload.date}</li>
      <li><strong>Time:</strong> ${payload.time}</li>
      <li><strong>Duration:</strong>  ${
        payload.durationMinutes || '00'
      } minutes</li>
      <li><strong>Platform:</strong> ${payload.platform}</li>
      <li><strong>Webinar Access Link:</strong> <a href="${
        payload.meetingUrl
      }">Click here to access the webinar</a></li>
  </ul>
  <p>Please mark your calendar and set a reminder for the event. On the day of the webinar, simply click on the provided access link to join the session.</p>
  <p>If you have any questions or need further information before the webinar, please feel free to reach out to us at <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a>.</p>
  <p>We look forward to having you with us and sharing valuable insights during the webinar. Thank you for your participation and support.</p>
  <p>Best regards,</p>
  <p><strong>Team SnowLabs Technology</strong></p>
`;
}

export function webinarCancelBody(payload: WebinarCancelInterface) {
  return `Dear <b>${payload.name} </b>, 
  <p>We hope this message finds you well. We regret to inform you that due to unforeseen circumstances, we must cancel the upcoming webinar scheduled for ${payload.date} ${payload.time}. We understand the inconvenience this may cause and sincerely apologize for any disruption to your plans. </p>
  
  <p>Our team is actively working on rescheduling the webinar, and we will keep you informed about the new date and time as soon as it is confirmed.</p>
  
  <p>In the meantime, if you have any questions or concerns, please feel free to reach out to our support team at contact details mentioned below. We appreciate your understanding and patience during this time.</p>
  
  <p>We value your participation and look forward to having you join us for the rescheduled webinar.</p>
  <p>Thank you for your understanding.</p>
  <p><b>Email</b>: training@snowlabstechnology.com</p>
  <p><b>Phone</b>: +91-7428334555</p>
  <p><b>Whatsapp</b>: https://wa.link/8v0eqa</p>
  <p>Thanks </p>
  <p><b>Team- SnowLabs Technology!</b></p>`;
}

export function getTrainerEnrollmentMailBody() {
  return `
  <p style="line-height: 100%;text-align: left;margin-bottom: 0.42cm;background: transparent;">Greetings Trainer,</p>
<p style="line-height: 100%;text-align: left;margin-bottom: 0.42cm;background: transparent;margin-top: 0.42cm;">Kindly follow the instructions outlined below to commence the session:</p>
<ol>
    <li>
        <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;"><strong>Platform:</strong> Microsoft Teams</p>
    </li>
    <li>
        <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;"><strong>Credentials:</strong></p>
        <ul>
            <li>
                <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">User ID: <span style="color: rgb(5, 99, 193);"><u><a href="mailto:snowlabs.trainer@snowlabstechnology.com" target="mailto:snowlabs.trainer@snowlabstechnology.com">snowlabs.trainer@snowlabstechnology.com</a></u></span></p>
            </li>
            <li>
                <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Password: Training#2022</p>
            </li>
            <li>
                <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Step 1: Log in to Microsoft Teams using the provided credentials.</p>
            </li>
            <li>
                <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Step 2: Access the session through the link sent to your email.</p>
            </li>
            <li>
                <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Step 3: <strong>Activate the recording feature.</strong></p>
            </li>
        </ul>
    </li>
</ol>
<p style="line-height: 100%;text-align: left;margin-bottom: 0.42cm;background: transparent;margin-top: 0.42cm;"><strong>Key Reminders:</strong></p>
<ol>
    <li>
        <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Ensure a single login before the program starts to prevent technical issues.</p>
    </li>
    <li>
        <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Initiate the batch 5 minutes prior to the scheduled time.</p>
    </li>
    <li>
        <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;"><strong>Maintain continuous activation of the recording throughout the session.</strong></p>
    </li>
    <li>
        <p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;">Refrain from sharing personal email addresses or phone numbers with participants.</p>
    </li>
</ol>
<p style="line-height: 100%;text-align: left;margin-bottom: 0cm;background: transparent;margin-top: 0.42cm;">Thank you</p>
<p style="line-height: 108%;text-align: left;margin-bottom: 0.28cm;background: transparent;"><strong>Team- SnowLabs Technology!</strong></p>
  `;
}

export function getCancellationMailBody(payload: SessionCancelInterface) {
  return `
  <p>Dear Trainer/ Learner,</p>  

  <p>Greetings from SnowLabs Technology!  </p>
 
  <p>The session originally scheduled for ${payload.date} at ${payload.time} has been canceled due to changes in the session schedule.</p> 
 
  <p>A new session will be arranged, and updated invites will be shared on your dashboard. </p>
 
  <p>If you have any questions , please feel free to connect with us training@snowlabstechnology.com </p>
 
  <p>Thanks  </p>
 
  <p><strong>Team- SnowLabs Technology!</strong></p> `;
}

export function getChangeBatchMailBody(payload: ChangeBatchInterface) {
  return `
  <p>Dear <strong>${payload.name}</strong></p>

  <p>Greetings from SnowLabs Technology! </p>

  <p>As requested, your batch that was originally scheduled for ${payload.oldDate} at ${payload.oldTime} has been shifted to ${payload.newDate} at ${payload.newTime}.</p>

  <p>A new session will be arranged, and updated invites will be shared on your dashboard.</p>

  <p>If you have any questions , please feel free to connect with us training@snowlabstechnology.com</p>

  <p>Thanks </p>

  <p><strong>Team- SnowLabs Technology!</strong></p>
  `;
}

export function getWantDetailsMailBody() {
  return `
  <p>Dear Learner, </p>
  <p>Thank you for your keen interest in our program </p>
  <p>One of our experienced advisors will get in touch with you shortly to discuss your inquiry and provide the assistance you need. We understand that your time is valuable, and we will make every effort to schedule a convenient time for this conversation.</p>
  <p>If you have any urgent query, please do not hesitate to reach out to us on training@snowlabstechnology.com </p>
  <p><strong>Phone</strong>: +91-7428334555</p>
  <p><strong>Whatsapp</strong>: https://wa.link/8v0eqa</p>
  <p>Thanks</p> 
  <p><strong>Team- SnowLabs Technology!</strong></p>`;
}

export function getBookDemoMailBody() {
  return `
  <p>Dear Learner, </p>
  <p>Thank you for reaching out and expressing interest in our Courses. We are delighted to assist you in providing access to a demo class.</p>
  <p>One of our experienced advisors will get in touch with you shortly to discuss and provide the assistance you need. We understand that your time is valuable, and we will make every effort to schedule a convenient time for this conversation.</p>
  <p>If you have any urgent query, please do not hesitate to reach out to us on training@snowlabstechnology.com 
  <p><strong>Phone:</strong> +91-7428334555 </p>
  <p><strong>Whatsapp:</strong> https://wa.link/8v0eqa</p>
  <p></p>
  <p>Thanks </p>
  <p><strong>Team- SnowLabs Technology!</strong></p>`;
}

export function getDownloadSyllabusMailBody() {
  return `
  <p>Dear Learner, </p>
  <p>Thank you for expressing interest in our courses and taking the time to download our course brochure. We appreciate your eagerness to explore the educational opportunities we offer.</p>
  <p>We look forward to the possibility of welcoming you to our learning community.</p>
  <p>If you have any questions or need further information, please feel free to reach out to us. Our team is here to assist you in any way we can.</p>
  <p>Phone: +91-7428334555 </p>
  <p>Whatsapp: https://wa.link/8v0eqa </p>
  <p>Email: training@snowlabstechnology.com</p>
  <p>Thanks </p>
  <p><strong>Team- SnowLabs Technology!</strong></p>`;
}

export function getWebinarCompletionMailBody(title: string) {
  const subject = 'Webinar Recording Now Available - Watch On Demand!';
  const body = `
  <p>Dear Learner,</p>
  <p>Thank you for joining our recent webinar, "${title}." We hope you found the session informative and valuable.</p>
  <p>We appreciate your active participation and engagement during the webinar. Your presence contributed to the success of the event.</p>
  <p>If you missed attending the webinar "${title}", you can review the event recording available on our website under On-Demand Webinars section. </p>
  <p>Simply click https://www.snowlabstechnology.com/webinar</p>
  <p>Thank you for your interest in our content, and we hope you find the on-demand recording beneficial.</p>
  <p>Best regards,</p>
  <p><strong>Team SnowLabs Technology</strong></p>`;

  return { subject, body };
}
