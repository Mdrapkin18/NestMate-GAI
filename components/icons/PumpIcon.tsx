import React from 'react';
import { Icon } from './Icon';

export const PumpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} stroke="currentColor" fill="none">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75h-1.551a3 3 0 00-2.36 1.145l-1.339 1.606a1.5 1.5 0 01-2.36 0L8.3 10.895a3 3 0 00-2.36-1.145H4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-3.72 0-6.75 3.03-6.75 6.75v1.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5v-1.5c0-3.72-3.03-6.75-6.75-6.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3.75m0 3.75V12m0 3.75h.375c.621 0 1.125.504 1.125 1.125V21a1.125 1.125 0 01-1.125 1.125h-1.5A1.125 1.125 0 019.75 21v-4.125c0-.621.504-1.125 1.125-1.125H12z" />
  </Icon>
);