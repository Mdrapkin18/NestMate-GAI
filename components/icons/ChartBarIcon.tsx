import React from 'react';
import { Icon } from './Icon';

export const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 21v-7.875zM12.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v12.375c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM21 4.125C21 3.504 21.504 3 22.125 3h2.25c.621 0 1.125.504 1.125 1.125v16.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" transform="scale(0.8) translate(1.5, 1.5)" />
  </Icon>
);