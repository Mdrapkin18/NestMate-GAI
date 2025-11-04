import React from 'react';
import { Icon } from './Icon';

export const DiaperIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="none">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.443 18.348c.399-.18.81-.33 1.23-.45l3.24-1.21a.75.75 0 01.62.03l.35.2a.75.75 0 00.73 0l.35-.2a.75.75 0 01.62-.04l3.24 1.22c.42.12.83.26 1.23.45 1.58.7 3.32.42 4.45-1.02a6.7 6.7 0 00-1.2-8.81 6.7 6.7 0 00-8.8-1.22 6.7 6.7 0 00-8.8 1.22 6.7 6.7 0 00-1.2 8.8c1.13 1.45 2.87 1.73 4.45 1.03Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5Z" />
  </Icon>
);