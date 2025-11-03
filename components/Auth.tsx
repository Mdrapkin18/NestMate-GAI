import React, { useState } from 'react';
import { GoogleIcon } from './icons/GoogleIcon';
import { useAuth } from '../hooks/useAuth';


const AuthInput: React.FC<{id: string, type: string, placeholder: string}> = ({id, type, placeholder}) => (
    <div>
        <label htmlFor={id} className="sr-only">{placeholder}</label>
        <input
            id={id}
            name={id}
            type={type}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
            placeholder={placeholder}
        />
    </div>
);

export const Auth: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const { signInWithGoogle } = useAuth();

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would handle email/password auth here.
        alert('Email/Password sign in is not implemented in this demo.');
    };


    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 text-light-text dark:text-dark-text">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                     <h1 className="font-bold text-3xl">NestMate</h1>
                </div>
                
                <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center mb-6">
                        {isLoginView ? 'Sign In' : 'Create an Account'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AuthInput id="email" type="email" placeholder="Email" />
                        <AuthInput id="password" type="password" placeholder="Password" />

                        {isLoginView && (
                            <div className="text-right">
                                <a href="#" className="text-sm font-medium text-primary hover:text-primary-700">Forgot password?</a>
                            </div>
                        )}

                        <div>
                            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                {isLoginView ? 'Sign In' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-light-surface dark:bg-dark-surface text-gray-500">OR</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button 
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-md font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <GoogleIcon className="w-6 h-6 mr-3" />
                                Sign in with Google
                            </button>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <button 
                            onClick={() => setIsLoginView(!isLoginView)} 
                            className="text-sm font-medium text-primary hover:text-primary-700"
                        >
                            {isLoginView ? "Don't have an account? Create account" : 'Already have an account? Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};