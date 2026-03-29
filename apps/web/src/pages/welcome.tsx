import { Link, useParams } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Folder01Icon,
  Layers01Icon,
  Shield01Icon,
  Settings01Icon,
  Link01Icon,
  FileValidationIcon,
  Search01Icon,
  Alert02Icon,
  Key01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  UserGroupIcon,
  DashboardBrowsingIcon,
  CheckmarkCircle01Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons'

// -- Flow Node Component --

function FlowNode({ icon, title, subtitle, description, color, bgColor, number }: {
  icon: any
  title: string
  subtitle: string
  description: string
  color: string
  bgColor: string
  number: number
}) {
  return (
    <div className="group relative">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/80">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgColor}`}>
            <HugeiconsIcon icon={icon} size={22} className={color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">{number}</span>
              <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
            </div>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">{subtitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="h-6 w-px bg-gradient-to-b from-zinc-700 to-zinc-800" />
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="text-zinc-600" />
      </div>
    </div>
  )
}

// -- Main Page --

export function WelcomePage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId ?? ''

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 pb-20">
      {/* Hero */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-primary-400/5 px-4 py-1.5 text-xs font-medium text-primary-400 mb-6">
          <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
          How Complerer Works
        </div>
        <h1 className="text-xl font-bold text-zinc-100 md:text-4xl">
          Compliance is a <span className="text-primary-400">project</span>, not a checklist
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
          Each certification effort is a project — scoped to a framework, tracked by controls, and proven by evidence.
          Shared assets like policies and access records power every project.
        </p>
      </div>

      {/* The Flow -- Main cascade */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">The Compliance Flow</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="space-y-0">
          <FlowNode
            number={1}
            icon={Folder01Icon}
            title="Create a Project"
            subtitle="Your certification effort"
            description="Start by creating a compliance project. Choose a framework (SOC 2, ISO 27001), set your audit period, and name your auditor."
            color="text-primary-400"
            bgColor="bg-primary-400/10"
          />
          <FlowArrow />
          <FlowNode
            number={2}
            icon={Layers01Icon}
            title="Frameworks & Controls"
            subtitle="Standards you follow"
            description="Each project is scoped to a framework version with hundreds of controls. Track coverage control-by-control."
            color="text-blue-400"
            bgColor="bg-blue-400/10"
          />
          <FlowArrow />
          <FlowNode
            number={3}
            icon={Shield01Icon}
            title="Policies"
            subtitle="Shared across projects"
            description="Define your organization's compliance policies once. They apply across all projects and link to framework controls."
            color="text-blue-400"
            bgColor="bg-blue-400/10"
          />
          <FlowArrow />
          <FlowNode
            number={4}
            icon={Settings01Icon}
            title="Baselines"
            subtitle="Shared — expected state, linked to controls"
            description="Set expected configurations — technical (MFA enabled) or procedural (training completed annually). Link baselines to framework controls: a baseline covering a control counts as coverage, reducing gaps automatically."
            color="text-purple-400"
            bgColor="bg-purple-400/10"
          />

          {/* Fork into two paths */}
          <div className="flex justify-center py-1">
            <div className="flex flex-col items-center">
              <div className="h-6 w-px bg-gradient-to-b from-zinc-700 to-zinc-800" />
              <div className="flex items-center gap-6 sm:gap-12">
                <div className="h-px w-12 sm:w-24 bg-zinc-800" />
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="text-zinc-600" />
                <div className="h-px w-12 sm:w-24 bg-zinc-800" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FlowNode
                number={5}
                icon={Link01Icon}
                title="Integrations & Events"
                subtitle="Data sources + real-time activity"
                description="Connect Okta, AWS, GitHub. Pull data automatically. Events track real-time activity."
                color="text-cyan-400"
                bgColor="bg-cyan-400/10"
              />
            </div>
            <div>
              <FlowNode
                number={5}
                icon={FileValidationIcon}
                title="Evidence"
                subtitle="Proof your controls are met"
                description="Proof your controls are met — auto-collected from integrations or uploaded manually. Evidence is workspace-level but linked per project."
                color="text-amber-400"
                bgColor="bg-amber-400/10"
              />
            </div>
          </div>

          <FlowArrow />

          <FlowNode
            number={6}
            icon={Search01Icon}
            title="Gap Analysis"
            subtitle="Computed automatically"
            description="Controls without evidence or baseline coverage = gaps. Baselines that cover a control reduce your gap count automatically. Your real-time compliance delta per project."
            color="text-orange-400"
            bgColor="bg-orange-400/10"
          />

          <FlowArrow />

          <FlowNode
            number={7}
            icon={Alert02Icon}
            title="Risk Register"
            subtitle="What could go wrong"
            description="Every gap is a risk. Track impact, likelihood, and mitigation plans."
            color="text-red-400"
            bgColor="bg-red-400/10"
          />
        </div>
      </div>

      {/* Access Register -- orthogonal */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Shared Across All Projects</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
              <HugeiconsIcon icon={Key01Icon} size={24} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">Access Register</h3>
              <p className="mt-0.5 text-xs font-medium text-green-400">Your full IT asset + access + cost management layer</p>
              <p className="mt-2 text-sm text-zinc-400">
                The Access Register is shared across all projects. It's your full IT asset + access + cost management layer:
                People, Systems, and Access Records.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-green-400" />
                <p className="text-sm font-semibold text-zinc-200">People</p>
              </div>
              <p className="text-xs text-zinc-500">Employee directory with departments, roles, and employment status. The "who" of your organization.</p>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <HugeiconsIcon icon={DashboardBrowsingIcon} size={16} className="text-green-400" />
                <p className="text-sm font-semibold text-zinc-200">Systems</p>
              </div>
              <p className="text-xs text-zinc-500">Tool and service inventory with classification, sensitivity, and environment. The "what" of your infrastructure.</p>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <HugeiconsIcon icon={Key01Icon} size={16} className="text-green-400" />
                <p className="text-sm font-semibold text-zinc-200">Access Records</p>
              </div>
              <p className="text-xs text-zinc-500">Who has access to what, with what role, at what cost, and in what status. The complete permission map.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>Feeds into:</span>
            {['Policies', 'Baselines', 'Evidence', 'Risk Register'].map((item) => (
              <span key={item} className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage Equation */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">How Coverage Works</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-zinc-400 mb-3">A control is <span className="text-zinc-100 font-semibold">covered</span> when it has at least one of:</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="rounded-lg bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-400">Evidence linked</span>
              <span className="text-zinc-600 text-lg">or</span>
              <span className="rounded-lg bg-purple-400/10 px-4 py-2 text-sm font-medium text-purple-400">Baseline linked</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 text-center">
            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-2xl font-bold text-zinc-100">142</p>
              <p className="text-xs text-zinc-500 mt-1">Total Controls</p>
            </div>
            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-2xl font-bold text-zinc-100">
                <span className="text-amber-400">87</span>
                <span className="text-zinc-600 mx-1">+</span>
                <span className="text-purple-400">35</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">Evidence + Baselines = Covered</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-2xl font-bold text-green-400">86%</p>
              <p className="text-xs text-zinc-500 mt-1">Coverage</p>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-600 mt-4">Controls covered by both evidence and baselines are counted once. Gaps = controls with neither.</p>
        </div>
      </div>

      {/* End-to-end Example */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">End-to-End Example</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-base font-semibold text-zinc-100 mb-1">
            "SOC 2 Type II — 2025"
          </h3>
          <p className="text-xs text-zinc-500 mb-6">Follow a single control through an entire compliance project</p>

          <div className="space-y-3">
            {[
              { step: 'Create Project', desc: '"SOC 2 Type II — 2025"', color: 'text-primary-400', bg: 'bg-primary-400/10' },
              { step: 'Framework', desc: 'SOC 2 v2024 with 142 controls', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { step: 'Policy', desc: '"All users must have MFA enabled" → linked to CC6.1', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { step: 'Baseline', desc: '"MFA enabled on all IdPs" → linked to CC6.1 → control covered', color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { step: 'Integration', desc: 'Connected to Microsoft Entra ID', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              { step: 'Evidence', desc: 'Report showing 100% MFA coverage → linked to CC6.1', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { step: 'Gap Analysis', desc: 'CC6.1 covered by baseline + evidence → 0 gaps', color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { step: 'Risk Register', desc: 'No residual risk for this control', color: 'text-red-400', bg: 'bg-red-400/10' },
              { step: 'Coverage', desc: '1 of 142 controls covered → repeat for all', color: 'text-green-400', bg: 'bg-green-400/10' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                  <span className={`text-xs font-bold ${item.color}`}>{i + 1}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`shrink-0 text-xs font-semibold ${item.color}`}>{item.step}</span>
                  <span className="text-zinc-700">—</span>
                  <span className="text-sm text-zinc-400 truncate">{item.desc}</span>
                </div>
                {i < 8 && <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="shrink-0 text-zinc-700" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Reference</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Folder01Icon, label: 'Projects', summary: 'Certification efforts', color: 'text-primary-400', bgColor: 'bg-primary-400/10' },
            { icon: Layers01Icon, label: 'Frameworks', summary: 'Standards & controls', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
            { icon: Shield01Icon, label: 'Policies', summary: 'Rules you define', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
            { icon: Settings01Icon, label: 'Baselines', summary: 'Expected state → covers controls', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
            { icon: Link01Icon, label: 'Integrations', summary: 'Data sources', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
            { icon: FileValidationIcon, label: 'Evidence', summary: 'Proof → covers controls', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
            { icon: Search01Icon, label: 'Gap Analysis', summary: 'Controls not yet covered', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
            { icon: Alert02Icon, label: 'Risk Register', summary: 'What could go wrong', color: 'text-red-400', bgColor: 'bg-red-400/10' },
            { icon: Key01Icon, label: 'Access Register', summary: 'Who has access + cost', color: 'text-green-400', bgColor: 'bg-green-400/10' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bgColor}`}>
                <HugeiconsIcon icon={item.icon} size={16} className={item.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">{item.label}</p>
                <p className="text-[10px] text-zinc-500">{item.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4 pb-8">
        <p className="text-sm text-zinc-500 mb-4">Ready to start your compliance program?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/w/$workspaceId/projects"
            params={{ workspaceId }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20"
          >
            Create Your First Project
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
          <Link
            to="/w/$workspaceId/dashboard"
            params={{ workspaceId }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
