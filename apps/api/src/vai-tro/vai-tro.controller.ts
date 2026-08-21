import { Controller, Get } from '@nestjs/common';
import { VaiTroService } from './vai-tro.service';

@Controller('vai-tro')
export class VaiTroController {
  constructor(private readonly vaiTroService: VaiTroService) {}

  @Get()
  findAll() {
    return this.vaiTroService.findAll();
  }
}
