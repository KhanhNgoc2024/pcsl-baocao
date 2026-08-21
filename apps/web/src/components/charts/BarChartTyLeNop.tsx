import { useState } from 'react';
import { MAU_TUAN_TU, MAU_TRUC, MAU_CHU_PHU, MAU_CHU_CHINH } from './palette';

export interface DiemTyLeNop {
  nhan: string;
  tyLe: number; // 0..1
  daNop: number;
  tongDonVi: number;
}

interface Props {
  duLieu: DiemTyLeNop[];
  height?: number;
}

const PAD_TRAI = 36;
const PAD_DUOI = 28;
const PAD_TREN = 12;
const PAD_PHAI = 8;

export function BarChartTyLeNop({ duLieu, height = 220 }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = Math.max(360, duLieu.length * 64);
  const plotW = width - PAD_TRAI - PAD_PHAI;
  const plotH = height - PAD_TREN - PAD_DUOI;
  const slotW = plotW / duLieu.length;
  const barW = Math.min(24, slotW - 8);

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} role="img" aria-label="Biểu đồ tỷ lệ nộp theo kỳ">
        {yTicks.map((t) => {
          const y = PAD_TREN + plotH - (t / 100) * plotH;
          return (
            <g key={t}>
              <line x1={PAD_TRAI} y1={y} x2={width - PAD_PHAI} y2={y} stroke={MAU_TRUC} strokeWidth={1} />
              <text x={PAD_TRAI - 8} y={y + 4} textAnchor="end" fontSize={11} fill={MAU_CHU_PHU}>
                {t}%
              </text>
            </g>
          );
        })}

        {duLieu.map((d, i) => {
          const slotX = PAD_TRAI + i * slotW;
          const barH = Math.max(0, d.tyLe * plotH);
          const barX = slotX + (slotW - barW) / 2;
          const barY = PAD_TREN + plotH - barH;
          const dangHover = hoverIndex === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect x={slotX} y={PAD_TREN} width={slotW} height={plotH} fill="transparent" />
              {barH > 0 && (
                <path
                  d={roundedTopRect(barX, barY, barW, barH, 4)}
                  fill={MAU_TUAN_TU}
                  opacity={dangHover ? 1 : 0.9}
                />
              )}
              <text x={slotX + slotW / 2} y={height - PAD_DUOI + 16} textAnchor="middle" fontSize={11} fill={MAU_CHU_PHU}>
                {d.nhan}
              </text>
              {dangHover && (
                <g>
                  <rect
                    x={Math.min(Math.max(barX - 30, 4), width - 148)}
                    y={Math.max(barY - 40, 2)}
                    width={140}
                    height={34}
                    rx={6}
                    fill="#0b0b0b"
                  />
                  <text
                    x={Math.min(Math.max(barX - 30, 4), width - 148) + 8}
                    y={Math.max(barY - 40, 2) + 14}
                    fontSize={11}
                    fill="#fff"
                  >
                    {`${d.daNop}/${d.tongDonVi} đơn vị`}
                  </text>
                  <text
                    x={Math.min(Math.max(barX - 30, 4), width - 148) + 8}
                    y={Math.max(barY - 40, 2) + 27}
                    fontSize={11}
                    fill="#fff"
                  >
                    {`${Math.round(d.tyLe * 100)}% đã nộp`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <line x1={PAD_TRAI} y1={PAD_TREN + plotH} x2={width - PAD_PHAI} y2={PAD_TREN + plotH} stroke={MAU_CHU_CHINH} strokeWidth={1} />
      </svg>
    </div>
  );
}

function roundedTopRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}
