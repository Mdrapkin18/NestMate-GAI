import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import { FeedingStats as FeedingStatsData, formatMinsToHours } from '../../utils/stats';
import { ChartCard } from './ChartCard';
import { Stat } from './Stat';

const COLORS = ['#7F56D9', '#B692F6']; // Primary, Primary-400

export const FeedingStats: React.FC<{ stats: FeedingStatsData }> = ({ stats }) => {
    const pieData = [
        { name: 'Left', value: stats.nursingBreakdown.leftMins },
        { name: 'Right', value: stats.nursingBreakdown.rightMins },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Feeding</h2>
            <div className="flex space-x-2">
                <Stat label="Avg Feeds/Day" value={stats.avgFeedsPerDay.toFixed(1)} />
                <Stat label="Total Bottle" value={`${stats.totalBottleOz.toFixed(1)} oz`} />
            </div>
            
            <ChartCard title="Daily Totals">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#8884d8" orientation="left" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'oz', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#667085' }} />
                        <YAxis yAxisId="right" stroke="#82ca9d" orientation="right" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'mins', angle: 90, position: 'insideRight', fontSize: 12, fill: '#667085' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }} labelStyle={{ color: '#cbd5e1' }} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar yAxisId="left" dataKey="bottleAmountOz" name="Bottle" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="nursingDurationMins" name="Nursing" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {pieData.length > 0 && (
                <ChartCard title="Nursing Side Breakdown">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${formatMinsToHours(value)}`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip formatter={(value) => `${formatMinsToHours(Number(value))}`} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}
        </div>
    );
};