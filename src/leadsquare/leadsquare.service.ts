import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { LeadDto } from './dto/capture-lead.dto';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class LeadsquareService {
  constructor(private readonly httpService: HttpService) {}

  private host = process.env.LEAD_SQ_BASE_URI;
  private accessKey = process.env.LEAD_SQ_ACCESS_KEY;
  private secretKey = process.env.LEAD_SQ_SECRET_KEY;

  /**
   * Creates new lead in LeadSquared
   *
   * @param LeadDto
   *
   * @returns Result of LeadSquare API call
   */
  async captureNewLead(createDto: LeadDto) {
    //  Setting up the config for axios instance
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    //  Destructuring all the properties
    const {
      email,
      company,
      countryCode,
      country,
      firstName,
      lastName,
      phone,
      formName,
      pageName,
      designation,
      course,
      trainingObjective,
      certification,
      message,
    } = createDto;

    //  This will serve as base value holder. Additional data will be pushed upon this variable.
    const data = [
      { Attribute: 'EmailAddress', Value: email },
      { Attribute: 'mx_Country_Code', Value: countryCode },
      { Attribute: 'Phone', Value: phone },
    ];

    //  Checking if the properties exist and if they do add them to the base array
    if (firstName) data.push({ Attribute: 'FirstName', Value: firstName });
    if (lastName) data.push({ Attribute: 'LastName', Value: lastName });
    if (company) data.push({ Attribute: 'Company', Value: company });
    if (formName) data.push({ Attribute: 'mx_Form_Name', Value: formName });
    if (pageName) data.push({ Attribute: 'mx_Form_Page', Value: pageName });
    if (country) data.push({ Attribute: 'mx_Country', Value: country });
    if (designation) data.push({ Attribute: 'JobTitle', Value: designation });
    if (course) data.push({ Attribute: 'mx_COURSES', Value: course });
    if (message) data.push({ Attribute: 'mx_Message1', Value: message });
    if (certification)
      data.push({ Attribute: 'mx_CERTIFICATIONS', Value: certification });
    if (trainingObjective)
      data.push({
        Attribute: 'mx_Training_objective',
        Value: trainingObjective,
      });

    //  Making the API call to leadsquared
    const response = await lastValueFrom(
      this.httpService.post(
        `https://${this.host}/v2/LeadManagement.svc/Lead.Capture?accessKey=${this.accessKey}&secretKey=${this.secretKey}`,
        data,
        requestConfig,
      ),
    );
    //  Returning the result after API call
    return response.data;
  }
}
