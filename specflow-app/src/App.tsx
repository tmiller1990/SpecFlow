import { useState, useCallback } from 'react';
import { Loader2, RotateCcw, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import type { UserRole } from './data/interfaces';
import { useAuthContext, AuthProvider } from './components/context';
import { ProjectList, ProjectView, LoginPage } from './components/pages';
import { resetDemoData } from './firestore';
import { auth } from './firebaseInit';

// --- App Navigation State ---
type ViewState = 'Dashboard' | 'ProjectView';

// --- Main App Component ---
const App = () => {
    const { user, isLoading, setRole, userId, loginAsDemo } = useAuthContext();
    const [view, setView] = useState<ViewState>('Dashboard');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSelectProject = useCallback((projectId: string) => {
        setActiveProjectId(projectId);
        setView('ProjectView');
    }, []);

    const handleBackToDashboard = useCallback(() => {
        setActiveProjectId(null);
        setView('Dashboard');
    }, []);

    const handleLoginAsDemo = async () => {
        setIsLoggingIn(true);
        try {
            await loginAsDemo();
        } catch (error) {
            console.error('Failed to login:', error);
            alert('Failed to login. Check console for details.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleResetDemo = async () => {
        if (!window.confirm('Are you sure you want to reset the demo? This will delete all user-created projects and return to the starting state with mock data.')) {
            return;
        }

        setIsResetting(true);
        try {
            await resetDemoData();
            // Reset UI state after successful reset
            setActiveProjectId(null);
            setView('Dashboard');
            alert('Demo reset complete! Page will refresh to show mock data.');
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset demo:', error);
            alert(`Reset failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsResetting(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Reset UI state before logging out
            setActiveProjectId(null);
            setView('Dashboard');
            if (auth) {
                await signOut(auth);
            }
        } catch (error) {
            console.error('Failed to logout:', error);
            alert('Failed to logout. Check console for details.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 mr-2 animate-spin text-indigo-500" />
                <span className="text-lg font-medium text-gray-700">Connecting to Firebase...</span>
            </div>
        );
    }

    if (!user) {
        return <LoginPage onAnonymousLogin={handleLoginAsDemo} isLoading={isLoggingIn || isLoading} />;
    }

    const navigationControls = (
        <div className="flex flex-col md:flex-row md:justify-center md:space-x-4 p-2 md:p-4 bg-white border-b border-gray-100 shadow-md gap-2 md:gap-0">
            <span className="text-gray-700 font-medium self-start md:self-center text-sm md:text-base">Role:</span>
            {['client', 'designer', 'gc'].map((role) => (
                <button
                    key={role}
                    onClick={() => {
                        setRole(role as UserRole);
                        setMobileMenuOpen(false);
                    }}
                    className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm rounded-full font-semibold transition-all duration-150 ${user.role === role ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                >
                    {role === 'gc' ? 'GC' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
            ))}
            <div className="border-t md:border-t-0 md:border-l border-gray-200 md:pl-4 pt-2 md:pt-0 flex items-center space-x-2 flex-wrap gap-2">
                <button
                    onClick={handleResetDemo}
                    disabled={isResetting}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm rounded-full font-semibold transition-all duration-150 bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isResetting ? (
                        <Loader2 className="w-3 md:w-4 h-3 md:h-4 animate-spin" />
                    ) : (
                        <RotateCcw className="w-3 md:w-4 h-3 md:h-4" />
                    )}
                    <span className="hidden md:inline">Reset Demo</span>
                    <span className="md:hidden">Reset</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm rounded-full font-semibold transition-all duration-150 bg-red-100 text-red-700 hover:bg-red-200"
                >
                    <LogOut className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="hidden md:inline">Logout</span>
                    <span className="md:hidden">Out</span>
                </button>
                <span className="text-xs text-gray-400 hidden md:inline">ID: {userId?.substring(0, 8)}</span>
            </div>
        </div>
    );

    let content;

    if (view === 'Dashboard') {
        content = <ProjectList onSelectProject={handleSelectProject} />;
    } else if (view === 'ProjectView' && activeProjectId) {
        content = <ProjectView projectId={activeProjectId} onBack={handleBackToDashboard} />;
    } else {
        content = <ProjectList onSelectProject={handleSelectProject} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="sticky top-0 z-20 bg-white shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center p-3 md:p-4">
                    <h1 className="text-xl md:text-2xl font-extrabold text-indigo-600">SpecFlow</h1>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:block flex-1">
                        {navigationControls}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6 text-gray-700" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-700" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white">
                        {navigationControls}
                    </div>
                )}
            </header>
            <main className="max-w-7xl mx-auto pb-12 px-4 md:px-0">
                {content}
            </main>
        </div>
    );
};

const RootApp = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default RootApp;