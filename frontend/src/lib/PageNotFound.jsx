import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-extralight text-slate-300 dark:text-slate-700">404</h1>
                        <div className="h-0.5 w-16 bg-primary/40 mx-auto"></div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            Page Not Found
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            The page <span className="font-mono font-medium text-primary">"/{pageName}"</span> could not be found in this application.
                        </p>
                    </div>

                    {isAuthenticated && (
                        <div className="p-3 bg-muted/60 rounded-md border border-border text-xs text-muted-foreground">
                            Logged in as: <span className="font-medium text-foreground">{user?.email || "Fleet Officer"}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 flex items-center justify-center gap-3">
                        <Button asChild variant="outline">
                            <Link to="/scenario">
                                <ArrowLeft className="w-4 h-4 mr-1.5" />
                                Go to Scenario
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link to="/">
                                <Home className="w-4 h-4 mr-1.5" />
                                Home Page
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}