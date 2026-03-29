import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Mail01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  Layers01Icon,
  Shield01Icon,
  FileValidationIcon,
  Key01Icon,
  Alert02Icon,
  Link01Icon,
  Settings01Icon,
  Search01Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'

type AuthStep = 'email' | 'otp' | 'name'

export function LoginPage() {
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      const result = await sendOtp(email)
      setDevCode(result.devCode ?? null)
      setStep('otp')
      setResendCountdown(60)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return
    await handleSendOtp()
  }

  const submitOtp = useCallback(
    async (digits: string[], providedName?: string) => {
      const code = digits.join('')
      if (code.length !== 6) return
      setError('')
      setLoading(true)
      try {
        const result = await verifyOtp(email, code, providedName || name || undefined)

        if (result.status === 'needs_name') {
          setStep('name')
          setLoading(false)
          return
        }

        if (result.status === 'workspace_created') {
          if (result.workspaceId) {
            localStorage.setItem('workspaceId', result.workspaceId)
            navigate({ to: '/onboarding' })
          }
          return
        }

        if (result.status === 'joined' && result.workspaceId) {
          localStorage.setItem('workspaceId', result.workspaceId)
          navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: result.workspaceId } })
          return
        }

        if (result.status === 'pending_invitation') {
          localStorage.setItem('pendingWorkspace', result.workspaceName ?? '')
          navigate({ to: '/pending' })
          return
        }

        // authenticated — existing user
        navigate({ to: '/' })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed')
        setOtpDigits(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      } finally {
        setLoading(false)
      }
    },
    [email, name, verifyOtp, navigate]
  )

  const handleNameSubmit = async () => {
    if (!name.trim()) return
    // Re-send OTP and verify with name
    setError('')
    setLoading(true)
    try {
      const result = await sendOtp(email)
      setDevCode(result.devCode ?? null)
      // We need to verify again with the name
      // But OTP was already used... We need a fresh one
      setStep('otp')
      setResendCountdown(60)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    if (value && newDigits.every((d) => d !== '')) {
      submitOtp(newDigits)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newDigits = [...otpDigits]
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setOtpDigits(newDigits)
    if (pasted.length === 6) {
      submitOtp(newDigits)
    } else {
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

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
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left — Branding + Flow visualization */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-12 lg:flex">
        <div>
          <img src="/logo-white.svg" alt="Complerer" className="h-8" />
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-zinc-100">
            Continuous compliance,
            <br />
            <span className="text-primary-400">automated.</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Map controls, collect evidence, detect gaps — all from a single pane of glass.
          </p>

          {/* Compliance flow visualization */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {flowNodes.map((node, i) => (
              <div
                key={node.label}
                className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-800/30 px-3 py-2.5"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 ${node.color}`}>
                  <HugeiconsIcon icon={node.icon} size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200">{node.label}</p>
                  <p className="text-[10px] text-zinc-500">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-4">
          {['SOC 2', 'ISO 27001', 'NIST CSF', 'CIS v8', 'PCI DSS'].map((badge) => (
            <div key={badge} className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-800/50 px-3 py-1.5">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-primary-400" />
              <span className="text-xs font-medium text-zinc-400">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Smart auth flow */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <img src="/logo-white.svg" alt="Complerer" className="mx-auto mb-3 h-9" />
          <p className="text-sm text-zinc-500">Continuous compliance, automated.</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Dev mode OTP banner */}
          {devCode && step === 'otp' && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-400">
              <span className="font-medium">Dev mode</span> — OTP:{' '}
              <code className="rounded bg-amber-500/20 px-2 py-0.5 font-mono font-bold tracking-widest">{devCode}</code>
            </div>
          )}

          {/* ── Step 1: Email ──────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-zinc-100">Welcome to Complerer</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Enter your email to sign in or create an account
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
                )}

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <HugeiconsIcon icon={Mail01Icon} size={16} className="text-zinc-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoFocus
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Sending code...' : 'Continue'}
                  {!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-zinc-600">
                We'll send a verification code to your email.
                <br />
                New here? An account will be created automatically.
              </p>
            </>
          )}

          {/* ── Step 2: OTP ────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => { setStep('email'); setError(''); setDevCode(null) }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  Change email
                </button>
                <h2 className="text-xl font-semibold text-zinc-100">Check your email</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  We sent a 6-digit code to <span className="font-medium text-zinc-300">{email}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
                )}

                <div className="flex justify-center gap-2.5">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="h-14 w-12 rounded-xl border border-zinc-700 bg-zinc-800 text-center text-2xl font-bold text-zinc-100 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    />
                  ))}
                </div>

                <button
                  onClick={() => submitOtp(otpDigits)}
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="mt-6 w-full rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                <div className="mt-4 text-center">
                  {resendCountdown > 0 ? (
                    <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
                      <HugeiconsIcon icon={Clock01Icon} size={14} />
                      Resend in {resendCountdown}s
                    </p>
                  ) : (
                    <button onClick={handleResendOtp} className="text-sm text-primary-400 transition-colors hover:text-primary-300">
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Name (new user only) ──────────────────────── */}
          {step === 'name' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-zinc-100">Welcome! What's your name?</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  This is your first time here. Tell us your name to get started.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
                )}

                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-300">Full name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                  />
                </div>

                <button
                  onClick={handleNameSubmit}
                  disabled={loading || !name.trim()}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Continue'}
                  {!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                </button>
              </div>
            </>
          )}

          {/* Bottom badges (mobile) */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
            {['SOC 2', 'ISO 27001', 'NIST CSF'].map((badge) => (
              <span key={badge} className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">{badge}</span>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
