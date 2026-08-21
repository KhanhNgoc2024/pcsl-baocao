import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * Nguyên tắc cách ly dữ liệu (§2):
 * - SYS_ADMIN: thấy tất cả.
 * - UNIT_ADMIN / APPROVER: thấy các bản ghi thuộc mẫu/yêu cầu do đơn vị mình tạo (đầu mối).
 * - REPORTER / VIEWER: chỉ thấy dữ liệu của đơn vị mình.
 */
export function hasRole(user: CurrentUserPayload, ...roles: string[]): boolean {
  return roles.some((r) => user.vaiTro.includes(r));
}

/**
 * Các trạng thái bản nộp coi là "đã đến phòng ban chủ trì" (đã nộp, theo góc nhìn của đơn vị đầu mối).
 * CHUA_NOP / NHAP / CHO_DUYET_DON_VI đều là chưa tới nơi — báo cáo còn nằm ở đơn vị nộp, chưa qua duyệt nội bộ.
 */
export const TRANG_THAI_DA_DEN_HUB: string[] = ['DA_NOP', 'DA_DUYET', 'TRA_LAI'];

export function isSysAdmin(user: CurrentUserPayload): boolean {
  return hasRole(user, 'SYS_ADMIN');
}

export function isDauMoiRole(user: CurrentUserPayload): boolean {
  return hasRole(user, 'UNIT_ADMIN', 'APPROVER');
}

export function mauBaoCaoScopeWhere(user: CurrentUserPayload): Prisma.MauBaoCaoWhereInput {
  if (isSysAdmin(user)) return {};
  if (isDauMoiRole(user)) return { donViTaoId: user.donViId };
  return { donViGiao: { some: { donViId: user.donViId } } };
}

export function kyBaoCaoScopeWhere(user: CurrentUserPayload): Prisma.KyBaoCaoWhereInput {
  if (isSysAdmin(user)) return {};
  if (isDauMoiRole(user)) return { mauBaoCao: { donViTaoId: user.donViId } };
  return { mauBaoCao: { donViGiao: { some: { donViId: user.donViId } } } };
}

export function baoCaoNopScopeWhere(user: CurrentUserPayload): Prisma.BaoCaoNopWhereInput {
  if (isSysAdmin(user)) return {};
  if (isDauMoiRole(user)) return { kyBaoCao: { mauBaoCao: { donViTaoId: user.donViId } } };
  return { donViId: user.donViId };
}

export function baoCaoVanBanScopeWhere(user: CurrentUserPayload): Prisma.BaoCaoVanBanWhereInput {
  if (isSysAdmin(user)) return {};
  if (isDauMoiRole(user)) return { donViTaoId: user.donViId };
  return { donViGiao: { some: { donViId: user.donViId } } };
}

export function bcvbNopScopeWhere(user: CurrentUserPayload): Prisma.BaoCaoVanBanNopWhereInput {
  if (isSysAdmin(user)) return {};
  if (isDauMoiRole(user)) return { baoCaoVanBan: { donViTaoId: user.donViId } };
  return { donViId: user.donViId };
}

export function assertScope(condition: boolean): void {
  if (!condition) {
    throw new ForbiddenException('Không có quyền truy cập dữ liệu này');
  }
}
