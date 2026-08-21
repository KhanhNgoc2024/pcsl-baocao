import { useState } from 'react';
import { MAU_PHAN_LOAI, MAU_TRUC, MAU_CHU_PHU, MAU_CHU_CHINH } from './palette';

export interface ChuoiSoLieu {
  ma: string;
  nhan: string;
  giaTri: number[]; // cùng độ dài với nhanTruc
}

interface Props {
  nhanTruc: string[]; // nhãn trục hoành (tên kỳ)
  chuoi: ChuoiSoLieu[];
  height?: number;
}

const PAD_TRAI = 48;
const PAD_DUOI = 28;
const PAD_TREN = 16;
const PAD_PHAI = 16;

function soTronDep(max: number): number {
  if (max <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const buoc = [1, 2, 5, 10].find((b) => max <= b * magnitude) ?? 10;
  return buoc * magnitude;
}

export function LineChartSoSanh({ nhanTruc, chuoi, height = 260 }: Props) {
  const [hover, setHover] = useState<{ seriesIdx: number; pointIdx: number } | null>(null);
  const width = Math.max(400, nhanTruc.length * 80);
  const plotW = width - PAD_TRAI - PAD_PHAI;
  const plotH = height - PAD_TREN - PAD_DUOI;

  const maxGiaTri = Math.max(1, ...chuoi.flatMap((c) => c.giaTri));
  const tranTruc = soTronDep(maxGiaTri) * 1.05;

  const x = (i: number) => PAD_TRAI + (nhanTruc.length <= 1 ? plotW / 2 : (i / (nhanTruc.length - 1)) * plotW);
  const y = (v: number) => PAD_TREN + plotH - (v / tranTruc) * plotH;

  const yTicks = Array.from({ length: 5 }, (_, i) => (tranTruc / 4) * i);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={width} height={height} role="img" aria-label="Biểu đồ so sánh số liệu qua các kỳ">
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD_TRAI} y1={y(t)} x2={width - PAD_PHAI} y2={y(t)} stroke={MAU_TRUC} strokeWidth={1} />
              <text x={PAD_TRAI - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MAU_CHU_PHU}>
                {Math.round(t).toLocaleString('vi-VN')}
              </text>
            </g>
          ))}

          {nhanTruc.map((nhan, i) => (
            <text key={i} x={x(i)} y={height - PAD_DUOI + 16} textAnchor="middle" fontSize={11} fill={MAU_CHU_PHU}>
              {nhan}
            </text>
          ))}

          {chuoi.map((c, si) => {
            const mau = MAU_PHAN_LOAI[si % MAU_PHAN_LOAI.length];
            const points = c.giaTri.map((v, i) => `${x(i)},${y(v)}`).join(' ');
            return (
              <g key={c.ma}>
                <polyline points={points} fill="none" stroke={mau} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {c.giaTri.map((v, i) => {
                  const dangHover = hover?.seriesIdx === si && hover.pointIdx === i;
                  return (
                    <g key={i} onMouseEnter={() => setHover({ seriesIdx: si, pointIdx: i })} onMouseLeave={() => setHover(null)}>
                      <circle cx={x(i)} cy={y(v)} r={9} fill="transparent" style={{ cursor: 'pointer' }} />
                      <circle cx={x(i)} cy={y(v)} r={4} fill={mau} stroke="#fcfcfb" strokeWidth={2} />
                      {dangHover && (
                        <g>
                          <rect x={Math.min(Math.max(x(i) - 60, 4), width - 128)} y={Math.max(y(v) - 46, 2)} width={124} height={34} rx={6} fill="#0b0b0b" />
                          <text x={Math.min(Math.max(x(i) - 60, 4), width - 128) + 8} y={Math.max(y(v) - 46, 2) + 14} fontSize={11} fill="#fff">
                            {c.nhan}
                          </text>
                          <text x={Math.min(Math.max(x(i) - 60, 4), width - 128) + 8} y={Math.max(y(v) - 46, 2) + 27} fontSize={11} fill="#fff">
                            {`${nhanTruc[i]}: ${v.toLocaleString('vi-VN')}`}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          <line x1={PAD_TRAI} y1={PAD_TREN + plotH} x2={width - PAD_PHAI} y2={PAD_TREN + plotH} stroke={MAU_CHU_CHINH} strokeWidth={1} />
        </svg>
      </div>

      {chuoi.length >= 2 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          {chuoi.map((c, si) => (
            <div key={c.ma} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: MAU_PHAN_LOAI[si % MAU_PHAN_LOAI.length],
                }}
              />
              <span style={{ fontSize: 12, color: MAU_CHU_PHU }}>{c.nhan}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
