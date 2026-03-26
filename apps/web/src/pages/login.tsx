import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  CheckmarkCircle01Icon,
  Mail01Icon,
  ArrowLeft01Icon,
  Clock01Icon,
  UserGroupIcon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'
import {
  Layers01Icon,
  Search01Icon,
  Link01Icon,
} from '@hugeicons/core-free-icons'

type Step =
  | 'email'
  | 'otp'
  | 'name'
  | 'pending_invitation'
  | 'workspace_created'

export function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [pendingWorkspaceName, setPendingWorkspaceName] = useState('')
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState('')

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
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
    async (digits: string[]) => {
      const code = digits.join('')
      if (code.length !== 6) return
      setError('')
      setLoading(true)
      try {
        const result = await verifyOtp(email, code, name || undefined)

        if (result.status === 'needs_name') {
          setStep('name')
          setLoading(false)
          return
        }

        if (result.status === 'pending_invitation') {
          setPendingWorkspaceName(result.workspaceName ?? '')
          setStep('pending_invitation')
          setLoading(false)
          return
        }

        if (result.status === 'workspace_created') {
          setCreatedWorkspaceId(result.workspaceId ?? '')
          // Go straight to new workspace
          if (result.workspaceId) {
            localStorage.setItem('workspaceId', result.workspaceId)
            navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: result.workspaceId } })
          }
          return
        }

        if (result.status === 'joined' && result.workspaceId) {
          localStorage.setItem('workspaceId', result.workspaceId)
          navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: result.workspaceId } })
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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      submitOtp(newDigits)
    } else if (value && newDigits.every((d) => d !== '')) {
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

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    // Re-send OTP and go back to OTP step with name attached
    setStep('otp')
    setOtpDigits(['', '', '', '', '', ''])
    setError('')
    setLoading(true)
    try {
      const result = await sendOtp(email)
      setDevCode(result.devCode ?? null)
      setResendCountdown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyWithName = async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const result = await verifyOtp(email, code, name)

      if (result.status === 'pending_invitation') {
        setPendingWorkspaceName(result.workspaceName ?? '')
        setStep('pending_invitation')
        return
      }

      if (result.status === 'workspace_created' && result.workspaceId) {
        localStorage.setItem('workspaceId', result.workspaceId)
        navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: result.workspaceId } })
        return
      }

      if (result.status === 'joined' && result.workspaceId) {
        localStorage.setItem('workspaceId', result.workspaceId)
        navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: result.workspaceId } })
        return
      }

      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left — Branding panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-12 lg:flex">
        <div>
          <img src="/logo-white.svg" alt="Complirer" className="h-8" />
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-zinc-100">
            Continuous compliance,
            <br />
            <span className="text-primary-400">automated.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Map controls across SOC 2, ISO 27001, NIST CSF, CIS v8, and PCI
            DSS. Collect evidence, detect gaps, and stay audit-ready — all from
            a single pane of glass.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 space-y-5">
            {[
              {
                icon: Layers01Icon,
                title: 'Multi-framework crosswalks',
                desc: 'Link evidence once, satisfy controls across all frameworks automatically.',
              },
              {
                icon: Search01Icon,
                title: 'AI-powered gap analysis',
                desc: 'Detect compliance gaps in real-time with intelligent control mapping.',
              },
              {
                icon: Link01Icon,
                title: 'Integrations that collect for you',
                desc: 'Connect Okta, AWS, Jira, and more to auto-collect evidence continuously.',
              },
              {
                icon: Shield01Icon,
                title: 'Audit-ready in minutes',
                desc: 'Generate narrative reports and compliance snapshots for your auditor.',
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-400/10">
                  <HugeiconsIcon
                    icon={feature.icon}
                    size={16}
                    className="text-primary-400"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6">
          {['SOC 2', 'ISO 27001', 'NIST CSF', 'CIS v8', 'PCI DSS'].map(
            (badge) => (
              <div
                key={badge}
                className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-800/50 px-3 py-1.5"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={12}
                  className="text-primary-400"
                />
                <span className="text-xs font-medium text-zinc-400">
                  {badge}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right — Auth flow */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <img
            src="/logo-white.svg"
            alt="Complirer"
            className="mx-auto mb-3 h-9"
          />
          <p className="text-sm text-zinc-500">
            Continuous compliance, automated.
          </p>
        </div>

        <div className="w-full max-w-sm">
          {/* Dev mode OTP banner */}
          {devCode && step === 'otp' && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-400">
              <span className="font-medium">Dev mode</span> — OTP code:{' '}
              <code className="rounded bg-amber-500/20 px-2 py-0.5 font-mono font-bold tracking-widest">
                {devCode}
              </code>
            </div>
          )}

          {/* ── Step 1: Email ────────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-zinc-100">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Enter your email to sign in
                </p>
              </div>

              <form
                onSubmit={handleSendOtp}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm"
              >
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-zinc-300"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={16}
                        className="text-zinc-500"
                      />
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
                  disabled={loading || !email}
                  className="mt-6 w-full rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Sending code...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP Verification ─────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setStep('email')
                    setError('')
                    setDevCode(null)
                  }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  Change email
                </button>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Check your email
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-zinc-300">{email}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* OTP digit inputs */}
                <div className="flex justify-center gap-2.5">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el
                      }}
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

                {/* Resend */}
                <div className="mt-4 text-center">
                  {resendCountdown > 0 ? (
                    <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
                      <HugeiconsIcon icon={Clock01Icon} size={14} />
                      Resend in {resendCountdown}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-sm text-primary-400 transition-colors hover:text-primary-300"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Name (new user) ──────────────────────────────── */}
          {step === 'name' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setStep('email')
                    setError('')
                  }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  Back
                </button>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Complete your profile
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Tell us your name to get started
                </p>
              </div>

              <form
                onSubmit={handleNameSubmit}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm"
              >
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-zinc-300"
                  >
                    Full name
                  </label>
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
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="mt-6 w-full rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Complete setup'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Pending Invitation ────────────────────────────── */}
          {step === 'pending_invitation' && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-400/10">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  size={28}
                  className="text-primary-400"
                />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">
                Request submitted
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Your request to join{' '}
                <span className="font-medium text-zinc-200">
                  {pendingWorkspaceName}
                </span>{' '}
                has been submitted.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                An admin will review your request and you will be notified once
                approved.
              </p>
              <button
                onClick={() => {
                  setStep('email')
                  setEmail('')
                  setName('')
                  setError('')
                  setDevCode(null)
                }}
                className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Back to login
              </button>
            </div>
          )}

          {/* Bottom badges (mobile) */}
          {(step === 'email' || step === 'otp') && (
            <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
              {['SOC 2', 'ISO 27001', 'NIST CSF'].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {(step === 'email' || step === 'otp') && (
            <p className="mt-6 text-center text-xs text-zinc-600">
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
