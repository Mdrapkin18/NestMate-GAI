import React from 'react';
import { Icon } from './Icon';

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="none">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 12 8.955-8.955a.75.75 0 0 1 1.06 0l8.955 8.955a.75.75 0 0 1-.53 1.28H19.5v7.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-7.5H3.28a.75.75 0 0 1-.53-1.28Z" />
  </Icon>
);