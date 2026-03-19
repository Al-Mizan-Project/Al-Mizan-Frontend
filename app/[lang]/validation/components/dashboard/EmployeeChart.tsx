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

interface EmployeeData {
  employee: string;
  evaluation: number;
  delayed: number;
  ready: number;
}

interface EmployeeChartProps {
  data: EmployeeData[];
  title: string;
  legends:{
    evaluation:string;
    delayed:string;
    ready:string;
  };
  lang?: string;
}

export default function EmployeeChart({ data, title, legends ,lang}: EmployeeChartProps) {
  return (
    <div className="val-chart-container p-6 w-full">
      <h3 className="val-subtitle mb-6">{title}</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-sm" 
            style={{ backgroundColor: 'var(--color-blue-6)' }}
          />
          <span className="val-body">{legends.evaluation}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-sm" 
            style={{ backgroundColor: 'var(--color-blue-4)' }}
          />
          <span className="val-body">{legends.delayed}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-sm" 
            style={{ backgroundColor: 'var(--color-blue-2)' }}
          />
          <span className="val-body">{legends.ready}</span>
        </div>
      </div>
      
      <div className="h-[280px] w-full" style={{ overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
            barSize={6}
            maxBarSize={6}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="var(--color-gray-200)" 
            />
            <XAxis 
              dataKey="employee" 
              axisLine={false} 
              tickLine={false}
              tick={{ 
                fill: 'var(--color-gray-500)', 
                fontSize: 10, 
                fontFamily: 'Inter, sans-serif' 
              }}
              height={30}
              interval={0}
              dy={5}
              angle={-45}
              textAnchor="end"
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
              dataKey="evaluation" 
              name={legends.evaluation}
              fill="var(--color-blue-6)" 
              radius={[0, 0, 0, 0]}
              barSize={6}
              maxBarSize={6}
            />
            <Bar 
              dataKey="delayed" 
              name={legends.delayed}
              fill="var(--color-blue-4)" 
              radius={[0, 0, 0, 0]}
              barSize={6}
              maxBarSize={6}
            />
            <Bar 
              dataKey="ready" 
              name={legends.ready}
              fill="var(--color-blue-2)" 
              radius={[0, 0, 0, 0]}
              barSize={6}
              maxBarSize={6}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}