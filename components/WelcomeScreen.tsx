import React from 'react';

export const WelcomeScreen: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 animate-fadeIn">
            <div className="text-center">
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 text-primary">
                    <path d="M71.9999 26.32C67.6399 21.96 62.0399 19.52 55.9999 19.52C49.9599 19.52 44.3599 21.96 39.9999 26.32L47.9999 34.32L71.9999 26.32Z" fill="currentColor" fillOpacity="0.5"/>
                    <path d="M48 58.76L32.24 43C27.88 47.36 25.44 52.96 25.44 59C25.44 65.04 27.88 70.64 32.24 75C36.6 79.36 42.2 81.8 48.24 81.8C54.28 81.8 59.88 79.36 64.24 75C68.6 70.64 71.04 65.04 71.04 59C71.04 52.96 68.6 47.36 64.24 43L48 58.76Z" fill="currentColor"/>
                    <path d="M78 48.0001C78 41.4001 75.32 35.3601 70.64 30.6801L48 53.3201L65.4 70.7201C72.88 64.6001 77.48 56.6801 78 48.0001Z" fill="currentColor" fillOpacity="0.5"/>
                    <path d="M48.0001 53.32L25.3601 30.68C20.6801 35.36 18.0001 41.4 18.0001 48C18.0001 56.68 22.6001 64.6 30.0801 70.72L48.0001 53.32Z" fill="currentColor"/>
                </svg>

                <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">NestMate</h1>
                <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mt-2">Tracking made simple.</p>
            </div>
            {/* Fix: Removed non-standard `jsx` prop from style tag */}
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fadeIn {
                animation: fadeIn 1s ease-in-out;
              }
            `}</style>
        </div>
    );
};