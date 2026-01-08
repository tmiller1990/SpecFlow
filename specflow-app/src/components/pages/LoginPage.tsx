import React, { useState } from 'react';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';

interface LoginPageProps {
    onAnonymousLogin: () => void;
    isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAnonymousLogin, isLoading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-600 via-indigo-500 to-blue-600 flex items-center justify-center p-3 md:p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-4 md:px-6 py-6 md:py-8 text-center">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">SpecFlow</h1>
                        <p className="text-indigo-100 text-xs md:text-sm">Construction Decision Management</p>
                    </div>

                    {/* Body */}
                    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                        {/* Standard Login Section (Disabled) */}
                        <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200">
                            <h2 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">
                                Sign In (Coming Soon)
                            </h2>

                            {/* Email Field */}
                            <div className="mb-3 md:mb-4">
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 md:w-5 h-4 md:h-5 text-gray-300" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Tyler@Ty.lerMiller.com"
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 placeholder-gray-300 cursor-not-allowed focus:outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="mb-2 md:mb-3">
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 md:w-5 h-4 md:h-5 text-gray-300" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="hunter2"
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 placeholder-gray-300 cursor-not-allowed focus:outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                disabled
                                className="w-full mt-3 md:mt-4 py-2 px-4 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed transition-all text-sm md:text-base"
                            >
                                Sign In
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-2 md:mt-3">
                                Login is Disabled for now.
                            </p>
                        </div>

                        {/* Demo Login Section (Active) */}
                        <div>
                            <h2 className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 md:mb-4">
                                Demo Access
                            </h2>

                            <button
                                onClick={onAnonymousLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2 md:py-3 px-4 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm md:text-base"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
                                ) : (
                                    <LogIn className="w-4 md:w-5 h-4 md:h-5" />
                                )}
                                {isLoading ? 'Logging in...' : 'Login as Demo User'}
                            </button>

                            <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">
                                Try the full SpecFlow experience with sample projects and demo data. Switch between different user roles to see how the app works from multiple perspectives.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
                        <p className="text-center text-xs text-gray-500">
                            This is a demo application. No personal data is stored permanently.
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 md:mt-6 text-center text-white text-xs md:text-sm">
                    <p>Get back to <a href="https://Ty.lerMiller.com">Ty.lerMiller.com</a></p>
                </div>
            </div>
        </div>
    );
};
