import React from 'react';
import { Icon } from './Icon';

export const FeedingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className} viewBox="0 0 24 24" stroke="currentColor" fill="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 3.5V2.75C4.5 2.2201 4.9701 1.75 5.5 1.75H8.5C9.0299 1.75 9.5 2.2201 9.5 2.75V3.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8.25V18C3 19.2426 3.9325 20.25 5.08333 20.25H12.9167C14.0675 20.25 15 19.2426 15 18V8.25" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6.5H15V8.25H3V6.5Z" />
    <path d="M6 11H6.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 14H6.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 17H6.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);