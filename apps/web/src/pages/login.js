import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon, ArrowLeft01Icon, ArrowRight01Icon, Clock01Icon, CheckmarkCircle01Icon, Layers01Icon, Shield01Icon, FileValidationIcon, Key01Icon, Alert02Icon, Link01Icon, Settings01Icon, Search01Icon, } from '@hugeicons/core-free-icons';
export function LoginPage() {
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [devCode, setDevCode] = useState(null);
    const [resendCountdown, setResendCountdown] = useState(0);
    const otpRefs = useRef([]);
    const { sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (resendCountdown <= 0)
            return;
        const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);
    const handleSendOtp = async (e) => {
        e?.preventDefault();
        if (!email.trim())
            return;
        setError('');
        setLoading(true);
        try {
            const result = await sendOtp(email);
            setDevCode(result.devCode ?? null);
            setStep('otp');
            setResendCountdown(60);
            setOtpDigits(['', '', '', '', '', '']);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send code');
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendOtp = async () => {
        if (resendCountdown > 0)
            return;
        await handleSendOtp();
    };
    const submitOtp = useCallback(async (digits, providedName) => {
        const code = digits.join('');
        if (code.length !== 6)
            return;
        setError('');
        setLoading(true);
        try {
            const result = await verifyOtp(email, code, providedName || name || undefined);
            if (result.status === 'needs_name') {
                setStep('name');
                setLoading(false);
                return;
            }
            if (result.status === 'workspace_created') {
                if (result.workspaceId) {
                    localStorage.setItem('workspaceId', result.workspaceId);
                    navigate({ to: '/onboarding' });
                }
                return;
            }
            if (result.status === 'joined' && result.workspaceId) {
                localStorage.setItem('workspaceId', result.workspaceId);
                navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: result.workspaceId } });
                return;
            }
            if (result.status === 'pending_invitation') {
                localStorage.setItem('pendingWorkspace', result.workspaceName ?? '');
                navigate({ to: '/pending' });
                return;
            }
            // authenticated — existing user
            navigate({ to: '/' });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setOtpDigits(['', '', '', '', '', '']);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
        finally {
            setLoading(false);
        }
    }, [email, name, verifyOtp, navigate]);
    const handleNameSubmit = async () => {
        if (!name.trim())
            return;
        // Re-send OTP and verify with name
        setError('');
        setLoading(true);
        try {
            const result = await sendOtp(email);
            setDevCode(result.devCode ?? null);
            // We need to verify again with the name
            // But OTP was already used... We need a fresh one
            setStep('otp');
            setResendCountdown(60);
            setOtpDigits(['', '', '', '', '', '']);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        }
        finally {
            setLoading(false);
        }
    };
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value))
            return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
        if (value && newDigits.every((d) => d !== '')) {
            submitOtp(newDigits);
        }
    };
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted)
            return;
        const newDigits = [...otpDigits];
        for (let i = 0; i < pasted.length; i++) {
            newDigits[i] = pasted[i];
        }
        setOtpDigits(newDigits);
        if (pasted.length === 6) {
            submitOtp(newDigits);
        }
        else {
            otpRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
    };
    // ── Flow visualization nodes for left panel ──
    const flowNodes = [
        { icon: Layers01Icon, label: 'Frameworks', desc: 'Standards you follow', color: 'text-primary-400' },
        { icon: Shield01Icon, label: 'Policies', desc: 'Rules you define', color: 'text-blue-400' },
        { icon: Settings01Icon, label: 'Baselines', desc: 'Expected state', color: 'text-purple-400' },
        { icon: Link01Icon, label: 'Integrations', desc: 'Data sources', color: 'text-cyan-400' },
        { icon: FileValidationIcon, label: 'Evidence', desc: 'Proof it\'s true', color: 'text-amber-400' },
        { icon: Search01Icon, label: 'Gap Analysis', desc: 'What\'s missing', color: 'text-orange-400' },
        { icon: Alert02Icon, label: 'Risk Register', desc: 'What could go wrong', color: 'text-red-400' },
        { icon: Key01Icon, label: 'Access Register', desc: 'Who has access', color: 'text-green-400' },
    ];
    return (_jsxs("div", { className: "flex min-h-screen bg-zinc-950", children: [_jsxs("div", { className: "hidden w-1/2 flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-12 lg:flex", children: [_jsx("div", { children: _jsx("img", { src: "/logo-white.svg", alt: "Complerer", className: "h-8" }) }), _jsxs("div", { className: "max-w-md", children: [_jsxs("h1", { className: "text-3xl font-bold leading-tight text-zinc-100", children: ["Continuous compliance,", _jsx("br", {}), _jsx("span", { className: "text-primary-400", children: "automated." })] }), _jsx("p", { className: "mt-3 text-sm text-zinc-500", children: "Map controls, collect evidence, detect gaps \u2014 all from a single pane of glass." }), _jsx("div", { className: "mt-8 grid grid-cols-2 gap-3", children: flowNodes.map((node, i) => (_jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-800/30 px-3 py-2.5", children: [_jsx("div", { className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 ${node.color}`, children: _jsx(HugeiconsIcon, { icon: node.icon, size: 14 }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-zinc-200", children: node.label }), _jsx("p", { className: "text-[10px] text-zinc-500", children: node.desc })] })] }, node.label))) })] }), _jsx("div", { className: "flex items-center gap-4", children: ['SOC 2', 'ISO 27001', 'NIST CSF', 'CIS v8', 'PCI DSS'].map((badge) => (_jsxs("div", { className: "flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-800/50 px-3 py-1.5", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 12, className: "text-primary-400" }), _jsx("span", { className: "text-xs font-medium text-zinc-400", children: badge })] }, badge))) })] }), _jsxs("div", { className: "flex w-full flex-col items-center justify-center px-6 lg:w-1/2", children: [_jsxs("div", { className: "mb-8 text-center lg:hidden", children: [_jsx("img", { src: "/logo-white.svg", alt: "Complerer", className: "mx-auto mb-3 h-9" }), _jsx("p", { className: "text-sm text-zinc-500", children: "Continuous compliance, automated." })] }), _jsxs("div", { className: "w-full max-w-sm", children: [devCode && step === 'otp' && (_jsxs("div", { className: "mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-400", children: [_jsx("span", { className: "font-medium", children: "Dev mode" }), " \u2014 OTP:", ' ', _jsx("code", { className: "rounded bg-amber-500/20 px-2 py-0.5 font-mono font-bold tracking-widest", children: devCode })] })), step === 'email' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-zinc-100", children: "Welcome to Complerer" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Enter your email to sign in or create an account" })] }), _jsxs("form", { onSubmit: handleSendOtp, className: "rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm", children: [error && (_jsx("div", { className: "mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400", children: error })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "mb-1.5 block text-sm font-medium text-zinc-300", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5", children: _jsx(HugeiconsIcon, { icon: Mail01Icon, size: 16, className: "text-zinc-500" }) }), _jsx("input", { id: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@company.com", autoFocus: true, className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30" })] })] }), _jsxs("button", { type: "submit", disabled: loading || !email.trim(), className: "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50", children: [loading ? 'Sending code...' : 'Continue', !loading && _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 16 })] })] }), _jsxs("p", { className: "mt-6 text-center text-xs text-zinc-600", children: ["We'll send a verification code to your email.", _jsx("br", {}), "New here? An account will be created automatically."] })] })), step === 'otp' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-6", children: [_jsxs("button", { onClick: () => { setStep('email'); setError(''); setDevCode(null); }, className: "mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200", children: [_jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 14 }), "Change email"] }), _jsx("h2", { className: "text-xl font-semibold text-zinc-100", children: "Check your email" }), _jsxs("p", { className: "mt-1 text-sm text-zinc-500", children: ["We sent a 6-digit code to ", _jsx("span", { className: "font-medium text-zinc-300", children: email })] })] }), _jsxs("div", { className: "rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm", children: [error && (_jsx("div", { className: "mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400", children: error })), _jsx("div", { className: "flex justify-center gap-2.5", children: otpDigits.map((digit, i) => (_jsx("input", { ref: (el) => { otpRefs.current[i] = el; }, type: "text", inputMode: "numeric", maxLength: 1, value: digit, onChange: (e) => handleOtpChange(i, e.target.value), onKeyDown: (e) => handleOtpKeyDown(i, e), onPaste: i === 0 ? handleOtpPaste : undefined, className: "h-14 w-12 rounded-xl border border-zinc-700 bg-zinc-800 text-center text-2xl font-bold text-zinc-100 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30" }, i))) }), _jsx("button", { onClick: () => submitOtp(otpDigits), disabled: loading || otpDigits.some((d) => !d), className: "mt-6 w-full rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50", children: loading ? 'Verifying...' : 'Verify' }), _jsx("div", { className: "mt-4 text-center", children: resendCountdown > 0 ? (_jsxs("p", { className: "flex items-center justify-center gap-1.5 text-sm text-zinc-500", children: [_jsx(HugeiconsIcon, { icon: Clock01Icon, size: 14 }), "Resend in ", resendCountdown, "s"] })) : (_jsx("button", { onClick: handleResendOtp, className: "text-sm text-primary-400 transition-colors hover:text-primary-300", children: "Resend code" })) })] })] })), step === 'name' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-zinc-100", children: "Welcome! What's your name?" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "This is your first time here. Tell us your name to get started." })] }), _jsxs("div", { className: "rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm", children: [error && (_jsx("div", { className: "mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400", children: error })), _jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "mb-1.5 block text-sm font-medium text-zinc-300", children: "Full name" }), _jsx("input", { id: "name", type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "Your name", autoFocus: true, className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30" })] }), _jsxs("button", { onClick: handleNameSubmit, disabled: loading || !name.trim(), className: "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50", children: [loading ? 'Creating account...' : 'Continue', !loading && _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 16 })] })] })] })), _jsx("div", { className: "mt-8 flex flex-wrap justify-center gap-2 lg:hidden", children: ['SOC 2', 'ISO 27001', 'NIST CSF'].map((badge) => (_jsx("span", { className: "rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500", children: badge }, badge))) }), _jsx("p", { className: "mt-6 text-center text-xs text-zinc-600", children: "By continuing, you agree to our Terms of Service and Privacy Policy." })] })] })] }));
}
//# sourceMappingURL=login.js.map