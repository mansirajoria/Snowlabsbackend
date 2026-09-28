import { CreateLeadDTO } from "query/dto/create-lead.dto";

export interface LeadSquareInterface {
  baseUri:string;  
  createLead(createDto:CreateLeadDTO):Promise<void>;
  updateLead():Promise<void>;
  getLead():Promise<void>;

}
