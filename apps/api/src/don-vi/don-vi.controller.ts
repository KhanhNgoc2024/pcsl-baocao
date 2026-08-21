import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { DonViService } from './don-vi.service';
import { CreateDonViDto } from './dto/create-don-vi.dto';
import { UpdateDonViDto } from './dto/update-don-vi.dto';

@Controller('don-vi')
export class DonViController {
  constructor(private readonly donViService: DonViService) {}

  @Get()
  findAll() {
    return this.donViService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.donViService.findOne(id);
  }

  @Post()
  @Roles('SYS_ADMIN')
  create(@Body() dto: CreateDonViDto) {
    return this.donViService.create(dto);
  }

  @Put(':id')
  @Roles('SYS_ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDonViDto) {
    return this.donViService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SYS_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donViService.remove(id);
  }
}
