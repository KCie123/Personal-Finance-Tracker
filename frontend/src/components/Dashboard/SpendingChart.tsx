import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
    name: string;
    value: number;
}

interface SpendingChartProps {
    data: ChartData[];
}

// Define some colors for the pie segments - add more as needed
// Consider generating these programmatically or using a larger palette
const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#ec4899', '#8b5cf6', '#eab308', '#64748b'];

const RADIAN = Math.PI / 180;
// Custom label renderer to show percentage on the slices
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Position label halfway
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

     // Don't render label if percentage is too small
     if ((percent * 100) < 3) {
         return null;
     }

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const SpendingChart: React.FC<SpendingChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">No data available for chart.</div>;
    }

    return (
        // Use ResponsiveContainer to make the chart adapt to its parent size
        <div style={{ width: '100%', height: 280 }}> {/* Approx h-64 + padding */}
            <ResponsiveContainer>
                <PieChart>
                     {/* Define the Pie */}
                    <Pie
                        data={data}
                        cx="50%" // Center X
                        cy="50%" // Center Y
                        labelLine={false} // Hide lines connecting labels
                        label={renderCustomizedLabel} // Use custom labels
                        outerRadius={100} // Outer size of the pie
                        innerRadius={50} // Makes it a Donut chart (0 for Pie)
                        fill="#8884d8" // Default fill (overridden by Cells)
                        paddingAngle={2} // Small gap between slices
                        dataKey="value" // The key in data objects for slice values
                    >
                        {/* Apply colors to each slice */}
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    {/* Add Tooltip for hover effect */}
                     <Tooltip
                         contentStyle={{ backgroundColor: 'rgba(40, 44, 52, 0.8)', border: 'none', borderRadius: '5px', color: '#fff' }} // Style tooltip
                         formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} // Format tooltip content
                     />
                     {/* Add Legend */}
                     <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SpendingChart; 