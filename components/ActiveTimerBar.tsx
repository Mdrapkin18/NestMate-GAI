
import React from 'react';
import { TimerState } from '../types';
import { useTimer } from '../hooks/useTimer';
import { formatDuration } from '../utils/helpers';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';

interface ActiveTimerBarProps {
  timer: TimerState;
  onStop: (id: string, duration: number) => void;
}

export const ActiveTimerBar: React.FC<ActiveTimerBarProps> = ({ timer, onStop }) => {
  const { elapsed, stop } = useTimer(timer.startedAt);

  const handleStop = () => {
    const duration = stop();
    onStop(timer.id, duration);
  };

  const isFeeding = timer.type === 'feed';
  const title = isFeeding ? 'Nursing' : 'Sleeping';
  const sideInfo = isFeeding && timer.side ? `- ${timer.side.charAt(0).toUpperCase()}${timer.side.slice(1)} Side` : '';

  return (
    <div className="bg-brand-teal/20 dark:bg-brand-teal/30 text-brand-teal-dark dark:text-brand-teal-light p-4 rounded-lg flex items-center justify-between shadow-md mb-6">
      <div className="flex items-center space-x-3">
        {isFeeding ? <FeedingIcon className="w-6 h-6 text-brand-teal-dark dark:text-brand-teal-light" /> : <SleepIcon className="w-6 h-6 text-brand-teal-dark dark:text-brand-teal-light" />}
        <div>
          <p className="font-semibold text-light-text dark:text-dark-text">{title} {sideInfo}</p>
          <p className="text-2xl font-bold tracking-wider text-light-text dark:text-dark-text">{formatDuration(elapsed)}</p>
        </div>
      </div>
      <button 
        onClick={handleStop}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200"
      >
        Stop
      </button>
    </div>
  );
};
