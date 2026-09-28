import { Module } from '@nestjs/common';
import { LeadsquareService } from './leadsquare.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [LeadsquareService],
  exports: [LeadsquareService],
})
export class LeadsquareModule {}
