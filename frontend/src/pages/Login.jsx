import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Zap, CheckCircle2, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
    const [email, setEmail] = useState("fleet@qflow.app");
    const [password, setPassword] = useState("qflow1234");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { loginDemo } = useAuth();
    const navigate = useNavigate();
    const returnTo = safeReturnTo();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // Log in with provided email or fallback default
            const userEmail = email.trim() || "fleet@qflow.app";
            loginDemo({ email: userEmail, full_name: userEmail.split('@')[0] });
            const target = returnTo && returnTo !== "/" ? returnTo : "/scenario";
            navigate(target, { replace: true });
        } catch (err) {
            setError(err.message || "Login failed. Please click 'Instant Access'.");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        loginDemo({ email: "fleet@qflow.app", full_name: "Fleet Officer" });
        const target = returnTo && returnTo !== "/" ? returnTo : "/scenario";
        navigate(target, { replace: true });
    };

    return (
        <AuthLayout
            icon={LogIn}
            title="Welcome back"
            subtitle="Sign in to access Q-GreenFleet & ShipOpt India"
            footer={
                <div className="space-y-2 text-center">
                    <p>
                        Don't have an account?{" "}
                        <Link
                            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
                            className="text-primary font-medium hover:underline"
                        >
                            Create one (Instant)
                        </Link>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Or jump straight to{" "}
                        <Link to="/scenario" className="text-primary hover:underline">
                            Scenario Simulation
                        </Link>
                        {" "}or{" "}
                        <Link to="/" className="text-primary hover:underline">
                            QFlow Landing Page
                        </Link>
                    </p>
                </div>
            }
        >
            {/* ─── Instant Access ─────────────────────────── */}
            <div className="mb-6 p-4 rounded-lg border-2 border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                        Account Ready
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Credentials have been preconfigured with full admin access to all optimization, benchmarking, and prediction modules.
                </p>
                <Button
                    id="instant-login-btn"
                    type="button"
                    className="w-full h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2"
                    onClick={handleDemoLogin}
                >
                    <Zap className="w-4 h-4" />
                    Instant Access (All Modules)
                </Button>
            </div>

            <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or sign in with custom credentials</span>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            to="/forgot-password"
                            className="text-xs text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-11"
                            required
                        />
                    </div>
                </div>

                <Button
                    id="submit-login-btn"
                    type="submit"
                    className="w-full h-11 font-medium"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </Button>
            </form>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Account active
                </span>
                <span>Role: Fleet Admin</span>
            </div>
        </AuthLayout>
    );
}
