import React from 'react';
import { Icon } from './Icon';

export const ActivityIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.08 3.25a1.5 1.5 0 0 1 2.12 2.12l-9.25 9.25-3.21.36.36-3.21 9.25-9.25Zm-1.41 1.41-9.26 9.25.8.8 9.25-9.26-.8-.8Z" />
  </Icon>
);