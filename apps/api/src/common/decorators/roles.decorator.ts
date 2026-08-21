import { SetMetadata } from '@nestjs/common';
import { MaVaiTro } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: MaVaiTro[]) => SetMetadata(ROLES_KEY, roles);
