import React from 'react';
import { Icon } from './Icon';

export const SleepIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.54 2.147a.93.93 0 0 0-1.08 0 8.44 8.44 0 0 1-3.32 1.34 8.44 8.44 0 0 1-4.48-1.34.93.93 0 0 0-1.08 1.53 9.9 9.9 0 0 0 4.99 15.26.93.93 0 0 0 1.22-.72 8.44 8.44 0 0 1 .1-4.88 8.44 8.44 0 0 1 3.32-3.32.93.93 0 0 0 .54-1.12 9.9 9.9 0 0 0-1.2-4.42.93.93 0 0 0-1.01-.35Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.82 9.42a.58.58 0 1 0-.82.82.58.58 0 0 0 .82-.82ZM20.25 6.75a.58.58 0 1 0 0 1.16.58.58 0 0 0 0-1.16Z" />
  </Icon>
);