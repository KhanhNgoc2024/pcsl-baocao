import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VaiTroService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.vaiTro.findMany({ orderBy: { id: 'asc' } });
  }
}
