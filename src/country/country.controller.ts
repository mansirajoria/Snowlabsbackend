import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Country-Controller')
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  // @Post()
  // create() {
  //   return this.countryService.create();
  // }

  @ApiQuery({ name: 'search', type: String, required: false })
  @Get()
  findAll(@Query('search') search: string) {
    return this.countryService.findAll(search);
  }
}
