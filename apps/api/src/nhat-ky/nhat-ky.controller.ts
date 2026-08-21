import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { NhatKyService } from './nhat-ky.service';

@Controller('nhat-ky')
export class NhatKyController {
  constructor(private readonly nhatKyService: NhatKyService) {}

  @Get()
  @Roles('SYS_ADMIN')
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '50') {
    return this.nhatKyService.list({ page: Number(page), pageSize: Number(pageSize) });
  }
}
