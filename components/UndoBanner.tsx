import React from 'react';

interface UndoBannerProps {
  onUndo: () => void;
}

export const UndoBanner: React.FC<UndoBannerProps> = ({ onUndo }) => {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
      <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg p-3 flex items-center justify-between animate-slide-up">
        <span className="text-sm">Entry saved.</span>
        <button onClick={onUndo} className="font-bold text-sm uppercase tracking-wider text-primary-400 hover:text-primary-300 transition-colors">
          Undo
        </button>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
