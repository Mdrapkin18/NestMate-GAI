import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { DiaperStats as DiaperStatsData } from '../../utils/stats';
import { ChartCard } from './ChartCard';
import { Stat } from './Stat';

export const DiaperStats: React.FC<{ stats: DiaperStatsData }> = ({ stats }) => {
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Diapering</h2>
            <div className="flex space-x-2">
                <Stat label="Avg Changes/Day" value={stats.avgChangesPerDay.toFixed(1)} />
            </div>

            <ChartCard title="Daily Diaper Types">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }} 
                            labelStyle={{ color: '#cbd5e1' }} 
                        />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="pee" name="Pee" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="poop" name="Poop" stackId="a" fill="#854d0e" />
                        <Bar dataKey="both" name="Both" stackId="a" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};