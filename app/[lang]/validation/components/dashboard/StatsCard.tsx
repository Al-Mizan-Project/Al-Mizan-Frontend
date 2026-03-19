'use client';

interface StatCardProps {
  title: string;
  value: number;
  trend: number;
}

export default function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <div className="val-stat-card">
      <div className="val-stat-card-title">
        {title}
      </div>
      <div className="absolute left-[17px] top-[70px] flex items-center gap-2">
        <span className="val-stat-card-value">{value}</span>
        <div className="val-badge-gray">
          <span className="val-badge-gray-text">{trend}%</span>
        </div>
      </div>
    </div>
  );
}