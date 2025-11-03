import React from 'react';
import { Icon } from './Icon';

export const BathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="none">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.125 9.75a.75.75 0 01.75-.75h14.25a.75.75 0 01.75.75v6.75a.75.75 0 01-.75.75H4.875a.75.75 0 01-.75-.75v-6.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75v-3.75m0 0a1.5 1.5 0 00-1.5 1.5H9a3 3 0 013-3V9m0 2.25a3 3 0 003 3h1.5a1.5 1.5 0 01-1.5-1.5M12 9V6.75m0 0a1.5 1.5 0 011.5 1.5h1.5a3 3 0 00-3-3V3m0 2.25a3 3 0 01-3 3H6a1.5 1.5 0 001.5-1.5" />
  </Icon>
);