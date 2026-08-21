import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonViDto } from './dto/create-don-vi.dto';
import { UpdateDonViDto } from './dto/update-don-vi.dto';

@Injectable()
export class DonViService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.donVi.findMany({ orderBy: [{ thuTu: 'asc' }, { tenDonVi: 'asc' }] });
  }

  async findOne(id: number) {
    const donVi = await this.prisma.donVi.findUnique({ where: { id } });
    if (!donVi) throw new NotFoundException('Không tìm thấy đơn vị');
    return donVi;
  }

  create(dto: CreateDonViDto) {
    return this.prisma.donVi.create({ data: dto });
  }

  async update(id: number, dto: UpdateDonViDto) {
    await this.findOne(id);
    return this.prisma.donVi.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.donVi.update({ where: { id }, data: { trangThai: 'NGUNG' } });
  }
}
