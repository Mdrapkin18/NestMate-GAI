import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { SleepStats as SleepStatsData, formatMinsToHours } from '../../utils/stats';
import { ChartCard } from './ChartCard';
import { Stat } from './Stat';

export const SleepStats: React.FC<{ stats: SleepStatsData }> = ({ stats }) => {
    
    const chartData = stats.dailyChartData.map(d => ({
        ...d,
        totalSleepHours: d.totalSleepMins / 60,
    }));

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Sleep</h2>
            <div className="flex space-x-2">
                <Stat label="Avg Daily Sleep" value={formatMinsToHours(stats.avgSleepPerDayMins)} />
                <Stat label="Longest Stretch" value={formatMinsToHours(stats.longestSleepMins)} />
            </div>

            <ChartCard title="Total Sleep per Day">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                        <Tooltip 
                            formatter={(value) => [`${Number(value).toFixed(1)} hours`, 'Total Sleep']}
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }} 
                            labelStyle={{ color: '#cbd5e1' }} 
                        />
                        <Bar dataKey="totalSleepHours" name="Hours" fill="#7F56D9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};