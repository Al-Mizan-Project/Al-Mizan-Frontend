'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DelayData {
  period: string;
  count: number;
}

interface DelayChartProps {
  data: DelayData[];
  title: string;
  legend?: string;
  lang?: string;
}

export default function DelayChart({ data, title ,legend,lang}: DelayChartProps) {
  return (
    <div className="val-chart-container p-6 w-full">
      <h3 className="val-subtitle mb-6">{title}</h3>
      
      {/* Légende */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-sm" 
            style={{ backgroundColor: 'var(--color-blue-5)' }}
          />
          <span className="val-body">{legend}</span>
        </div>
      </div>
      
      {/* Graphique */}
      <div className="h-[280px] w-full" style={{ overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
            barSize={8}
            maxBarSize={8}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="var(--color-gray-200)" 
            />
            <XAxis 
              dataKey="period" 
              axisLine={false} 
              tickLine={false}
              tick={{ 
                fill: 'var(--color-gray-500)', 
                fontSize: 11, 
                fontFamily: 'Inter, sans-serif' 
              }}
              height={30}
              interval={0}
              dy={5}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ 
                fill: 'var(--color-gray-500)', 
                fontSize: 11, 
                fontFamily: 'Inter, sans-serif' 
              }}
              width={30}
              domain={[0, 60]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-white)', 
                border: '1px solid var(--color-gray-200)',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px'
              }}
              cursor={{ fill: 'var(--color-gray-100)' }}
            />
            <Bar 
              dataKey="count" 
              fill="var(--color-blue-5)" 
              radius={[0, 0, 0, 0]}
              barSize={8}
              maxBarSize={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}