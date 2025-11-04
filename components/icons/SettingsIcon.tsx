import React from 'react';
import { Icon } from './Icon';

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="none">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 8.25h3m-3 7.5h3m-10.5-4.5h15m-15 0a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3m-15 0a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3h15a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3" />
  </Icon>
);