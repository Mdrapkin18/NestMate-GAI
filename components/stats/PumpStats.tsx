import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { PumpStats as PumpStatsData } from '../../utils/stats';
import { ChartCard } from './ChartCard';
import { Stat } from './Stat';

export const PumpStats: React.FC<{ stats: PumpStatsData }> = ({ stats }) => {

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Pumping</h2>
             <div className="flex space-x-2">
                <Stat label="Avg Daily Volume" value={`${stats.avgPumpedPerDayOz.toFixed(1)} oz`} />
            </div>

            <ChartCard title="Total Pumped Volume per Day">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.dailyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}oz`} />
                        <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)} oz`, 'Total Volume']}
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#cbd5e1' }}
                        />
                        <Line type="monotone" dataKey="totalAmountOz" name="Volume" stroke="#6941C6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};