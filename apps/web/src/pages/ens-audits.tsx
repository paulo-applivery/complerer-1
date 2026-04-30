import { useMemo, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  Cancel01Icon,
  Shield01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons'
import { useProjects } from '@/hooks/use-projects'
import {
  useEnsAudits,
  useEnsAudit,
  useCreateEnsAudit,
  useUpdateEnsAudit,
  useComputeVerdict,
  useCitad,
  useCreateCitad,
  useDeleteCitad,
  useFindings,
  useCreateFinding,
  useUpdateFinding,
  useDeleteFinding,
  useQualityFlags,
  useEnsCatalogue,
  useAuditResults,
  useUpsertAuditResult,
  useAspectResults,
  useUpsertAspectResults,
  usePac,
  useUpsertPac,
  type SystemCategory,
  type CitadLevel,
  type Severity,
  type Verdict,
  type Finding,
  type AuditResult,
  type EnsCatalogueControl,
} from '@/hooks/use-ens-audits'

const VERDICT_LABEL: Record<Verdict, { label: string; color: string }> = {
  FAVORABLE: { label: 'Favorable', color: 'bg-emerald-500/10 text-emerald-400' },
  FAVORABLE_CON_NO_CONFORMIDADES: {
    label: 'Favorable c/ NC',
    color: 'bg-amber-500/10 text-amber-400',
  },
  DESFAVORABLE: { label: 'Desfavorable', color: 'bg-red-500/10 text-red-400' },
}

const SEVERITY_LABEL: Record<Severity, { label: string; color: string }> = {
  NO_CONFORMIDAD_MAYOR: { label: 'NC mayor', color: 'bg-red-500/10 text-red-400' },
  NO_CONFORMIDAD_MENOR: { label: 'NC menor', color: 'bg-orange-500/10 text-orange-400' },
  OBSERVACION: { label: 'Observación', color: 'bg-amber-500/10 text-amber-400' },
  PUNTO_DE_MEJORA: { label: 'Punto de mejora', color: 'bg-blue-500/10 text-blue-400' },
}

const CATEGORY_LABEL: Record<SystemCategory, string> = {
  BASICA: 'Básica',
  MEDIA: 'Media',
  ALTA: 'Alta',
}

export function EnsAuditsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const navigate = useNavigate()

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: auditsData, isLoading: auditsLoading } = useEnsAudits(workspaceId)
  const audits = auditsData?.audits ?? []

  if (selectedAuditId) {
    return (
      <AuditDetailView
        workspaceId={workspaceId}
        auditId={selectedAuditId}
        onBack={() => setSelectedAuditId(null)}
      />
    )
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">ENS Audits</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Esquema Nacional de Seguridad (RD 311/2022) audit cycles, findings & PAC.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          New audit
        </button>
      </header>

      {auditsLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
        </div>
      ) : audits.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {audits.map((audit) => (
            <button
              key={audit.id}
              type="button"
              onClick={() => setSelectedAuditId(audit.id)}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <div className="mb-2 flex items-center gap-2">
                <HugeiconsIcon
                  icon={Shield01Icon}
                  size={16}
                  className="text-primary-400"
                />
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                  {audit.audit_type}
                </span>
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {CATEGORY_LABEL[audit.system_category]}
                </span>
              </div>
              <h3 className="text-base font-semibold text-zinc-100">
                {audit.cycle_label}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Status: <span className="text-zinc-400">{audit.status}</span>
              </p>
              {audit.overall_verdict && (
                <span
                  className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${VERDICT_LABEL[audit.overall_verdict].color}`}
                >
                  {VERDICT_LABEL[audit.overall_verdict].label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {creating && (
        <CreateAuditModal
          workspaceId={workspaceId}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            setSelectedAuditId(id)
          }}
        />
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
      <HugeiconsIcon
        icon={Shield01Icon}
        size={40}
        className="mx-auto text-zinc-600"
      />
      <h3 className="mt-4 text-base font-medium text-zinc-200">
        No ENS audits yet
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Start an audit cycle on a compliance project bound to ENS.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={16} />
        Create first audit
      </button>
    </div>
  )
}

// ── Create modal ───────────────────────────────────────────────

function CreateAuditModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string | undefined
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const { projects } = useProjects(workspaceId)
  const ensProjects = projects.filter((p) =>
    p.frameworkSlug === 'ens' || /ens/i.test(p.frameworkName)
  )

  const [projectId, setProjectId] = useState(ensProjects[0]?.id ?? '')
  const [cycleLabel, setCycleLabel] = useState('')
  const [auditType, setAuditType] = useState<
    'inicial' | 'renovacion' | 'seguimiento' | 'interna'
  >('inicial')
  const [systemCategory, setSystemCategory] = useState<SystemCategory>('BASICA')
  const [isAapp, setIsAapp] = useState(false)
  const [auditorName, setAuditorName] = useState('')
  const [auditorFirm, setAuditorFirm] = useState('')

  const createMut = useCreateEnsAudit(workspaceId)

  const submit = async () => {
    if (!projectId || !cycleLabel.trim()) return
    const result = await createMut.mutateAsync({
      projectId,
      cycleLabel: cycleLabel.trim(),
      auditType,
      systemCategory,
      isAapp,
      auditorName: auditorName.trim() || undefined,
      auditorFirm: auditorFirm.trim() || undefined,
    })
    const id = (result as { audit?: { id: string } } | undefined)?.audit?.id
    if (id) onCreated(id)
  }

  return (
    <Modal title="New ENS audit" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Label>Compliance project</Label>
          {ensProjects.length === 0 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-400">
              No ENS-bound projects in this workspace. Create a project on the ENS
              framework first.
            </p>
          ) : (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={selectClass}
            >
              {ensProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.frameworkVersion}
                </option>
              ))}
            </select>
          )}
        </div>

        <Field
          label="Cycle label"
          placeholder="e.g. Auditoría 2026 — Certificación inicial"
          value={cycleLabel}
          onChange={setCycleLabel}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Audit type</Label>
            <select
              value={auditType}
              onChange={(e) =>
                setAuditType(e.target.value as 'inicial' | 'renovacion' | 'seguimiento' | 'interna')
              }
              className={selectClass}
            >
              <option value="inicial">Inicial</option>
              <option value="renovacion">Renovación</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="interna">Interna</option>
            </select>
          </div>

          <div>
            <Label>System category</Label>
            <select
              value={systemCategory}
              onChange={(e) => setSystemCategory(e.target.value as SystemCategory)}
              className={selectClass}
            >
              <option value="BASICA">Básica</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>
        </div>

        <Field label="Auditor name" value={auditorName} onChange={setAuditorName} />
        <Field label="Auditor firm" value={auditorFirm} onChange={setAuditorFirm} />

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isAapp}
            onChange={(e) => setIsAapp(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-primary-400"
          />
          Entity is a Spanish public administration (AAPP)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!projectId || !cycleLabel.trim() || createMut.isPending}
            className={btnPrimary}
          >
            {createMut.isPending ? 'Creating…' : 'Create audit'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Audit detail ──────────────────────────────────────────────

type AuditTab = 'overview' | 'citad' | 'controls' | 'findings' | 'quality'

function AuditDetailView({
  workspaceId,
  auditId,
  onBack,
}: {
  workspaceId: string | undefined
  auditId: string
  onBack: () => void
}) {
  const [tab, setTab] = useState<AuditTab>('overview')
  const { data, isLoading } = useEnsAudit(workspaceId, auditId)
  const audit = (data as { audit?: Record<string, unknown> } | undefined)?.audit as
    | (typeof data extends { audit: infer T } ? T : never)
    | undefined
  const computeMut = useComputeVerdict(workspaceId, auditId)
  const updateMut = useUpdateEnsAudit(workspaceId, auditId)

  if (isLoading || !audit) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
      </div>
    )
  }

  const a = audit as unknown as {
    id: string
    cycle_label: string
    audit_type: string
    system_category: SystemCategory
    is_aapp: number
    status: string
    overall_verdict: Verdict | null
    pac_required: number
    auditor_name: string | null
    auditor_firm: string | null
    scope_description: string | null
  }

  return (
    <div className="space-y-6 p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
        Back to audits
      </button>

      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
              {a.audit_type}
            </span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              Categoría {CATEGORY_LABEL[a.system_category]}
            </span>
            {a.is_aapp ? (
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                AAPP
              </span>
            ) : null}
            {a.overall_verdict && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${VERDICT_LABEL[a.overall_verdict].color}`}
              >
                {VERDICT_LABEL[a.overall_verdict].label}
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">{a.cycle_label}</h1>
          {a.scope_description && (
            <p className="mt-1 text-sm text-zinc-500">{a.scope_description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => computeMut.mutate()}
            disabled={computeMut.isPending}
            className={btnSecondary}
          >
            {computeMut.isPending ? 'Computing…' : 'Compute verdict'}
          </button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-zinc-800">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={tab === 'citad'} onClick={() => setTab('citad')}>
          CITAD
        </TabButton>
        <TabButton active={tab === 'controls'} onClick={() => setTab('controls')}>
          Controls
        </TabButton>
        <TabButton active={tab === 'findings'} onClick={() => setTab('findings')}>
          Findings
        </TabButton>
        <TabButton active={tab === 'quality'} onClick={() => setTab('quality')}>
          Quality flags
        </TabButton>
      </nav>

      {tab === 'overview' && <OverviewTab audit={a} workspaceId={workspaceId} auditId={auditId} updateMut={updateMut} />}
      {tab === 'citad' && <CitadTab workspaceId={workspaceId} auditId={auditId} />}
      {tab === 'controls' && (
        <ControlsTab
          workspaceId={workspaceId}
          auditId={auditId}
          systemCategory={a.system_category}
        />
      )}
      {tab === 'findings' && <FindingsTab workspaceId={workspaceId} auditId={auditId} />}
      {tab === 'quality' && <QualityTab workspaceId={workspaceId} auditId={auditId} />}
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────

function OverviewTab({
  audit,
  workspaceId: _workspaceId,
  auditId: _auditId,
  updateMut,
}: {
  audit: {
    auditor_name: string | null
    auditor_firm: string | null
    status: string
    pac_required: number
  }
  workspaceId: string | undefined
  auditId: string
  updateMut: ReturnType<typeof useUpdateEnsAudit>
}) {
  const [status, setStatus] = useState(audit.status)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Auditor">
        <Row label="Name" value={audit.auditor_name ?? '—'} />
        <Row label="Firm" value={audit.auditor_firm ?? '—'} />
      </Card>
      <Card title="Lifecycle">
        <Row
          label="PAC required"
          value={
            audit.pac_required ? (
              <span className="text-amber-400">Yes</span>
            ) : (
              <span className="text-emerald-400">No</span>
            )
          }
        />
        <div className="mt-2">
          <Label>Status</Label>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              <option value="planning">Planning</option>
              <option value="fieldwork">Fieldwork</option>
              <option value="drafting">Drafting</option>
              <option value="reported">Reported</option>
              <option value="closed">Closed</option>
            </select>
            <button
              type="button"
              onClick={() => updateMut.mutate({ status })}
              disabled={status === audit.status || updateMut.isPending}
              className={btnPrimary}
            >
              Save
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── CITAD tab ─────────────────────────────────────────────────

function CitadTab({
  workspaceId,
  auditId,
}: {
  workspaceId: string | undefined
  auditId: string
}) {
  const { data } = useCitad(workspaceId, auditId)
  const valuations = data?.valuations ?? []
  const createMut = useCreateCitad(workspaceId, auditId)
  const deleteMut = useDeleteCitad(workspaceId, auditId)

  const [serviceName, setServiceName] = useState('')
  const [serviceKind, setServiceKind] = useState<'service' | 'information'>('service')
  const [c, setC] = useState<CitadLevel | ''>('')
  const [i, setI] = useState<CitadLevel | ''>('')
  const [t, setT] = useState<CitadLevel | ''>('')
  const [a, setA] = useState<CitadLevel | ''>('')
  const [d, setD] = useState<CitadLevel | ''>('')

  const submit = async () => {
    if (!serviceName.trim()) return
    await createMut.mutateAsync({
      serviceName: serviceName.trim(),
      serviceKind,
      cValue: c || null,
      iValue: i || null,
      tValue: t || null,
      aValue: a || null,
      dValue: d || null,
    })
    setServiceName('')
    setC(''); setI(''); setT(''); setA(''); setD('')
  }

  return (
    <div className="space-y-4">
      <Card title="Add valuation">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Service or information name" value={serviceName} onChange={setServiceName} />
          <div>
            <Label>Kind</Label>
            <select
              value={serviceKind}
              onChange={(e) => setServiceKind(e.target.value as 'service' | 'information')}
              className={selectClass}
            >
              <option value="service">Service</option>
              <option value="information">Information</option>
            </select>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {(['C', 'I', 'T', 'A', 'D'] as const).map((dim) => {
            const value = dim === 'C' ? c : dim === 'I' ? i : dim === 'T' ? t : dim === 'A' ? a : d
            const setter =
              dim === 'C' ? setC : dim === 'I' ? setI : dim === 'T' ? setT : dim === 'A' ? setA : setD
            return (
              <div key={dim}>
                <Label>{dim}</Label>
                <select
                  value={value}
                  onChange={(e) => setter((e.target.value || '') as CitadLevel | '')}
                  className={selectClass}
                >
                  <option value="">—</option>
                  <option value="BAJO">Bajo</option>
                  <option value="MEDIO">Medio</option>
                  <option value="ALTO">Alto</option>
                </select>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!serviceName.trim() || createMut.isPending}
            className={btnPrimary}
          >
            Add valuation
          </button>
        </div>
      </Card>

      <Card title={`Valuations (${valuations.length})`}>
        {valuations.length === 0 ? (
          <p className="text-sm text-zinc-500">No valuations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="pb-2">Asset</th>
                <th className="pb-2">Kind</th>
                <th className="pb-2 text-center">C</th>
                <th className="pb-2 text-center">I</th>
                <th className="pb-2 text-center">T</th>
                <th className="pb-2 text-center">A</th>
                <th className="pb-2 text-center">D</th>
                <th className="pb-2">Derived</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {valuations.map((v) => (
                <tr key={v.id} className="border-b border-zinc-800/50 text-zinc-300">
                  <td className="py-2">{v.service_name}</td>
                  <td className="py-2 text-xs text-zinc-500">{v.service_kind}</td>
                  <td className="py-2 text-center text-xs">{v.c_value ?? '—'}</td>
                  <td className="py-2 text-center text-xs">{v.i_value ?? '—'}</td>
                  <td className="py-2 text-center text-xs">{v.t_value ?? '—'}</td>
                  <td className="py-2 text-center text-xs">{v.a_value ?? '—'}</td>
                  <td className="py-2 text-center text-xs">{v.d_value ?? '—'}</td>
                  <td className="py-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium">
                      {CATEGORY_LABEL[v.derived_category]}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteMut.mutate(v.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

// ── Controls tab ──────────────────────────────────────────────

const CATEGORY_KEY: Record<SystemCategory, 'basica' | 'media' | 'alta'> = {
  BASICA: 'basica',
  MEDIA: 'media',
  ALTA: 'alta',
}

function appliesAtCategory(
  ctrl: EnsCatalogueControl,
  category: SystemCategory
): { applies: boolean; cell: string } {
  const cell = ctrl.applicability?.[CATEGORY_KEY[category]] ?? ''
  return {
    applies: cell !== '' && cell !== 'n.a.',
    cell: cell || 'n.a.',
  }
}

function ControlsTab({
  workspaceId,
  auditId,
  systemCategory,
}: {
  workspaceId: string | undefined
  auditId: string
  systemCategory: SystemCategory
}) {
  const { data: catalogue, isLoading } = useEnsCatalogue(workspaceId)
  const { data: resultsData } = useAuditResults(workspaceId, auditId)
  const controls = catalogue?.controls ?? []
  const results = resultsData?.results ?? []

  const resultByControl = useMemo(() => {
    const m = new Map<string, AuditResult>()
    for (const r of results) m.set(r.control_id, r)
    return m
  }, [results])

  const [groupFilter, setGroupFilter] = useState<string>('')
  const [showOnlyApplicable, setShowOnlyApplicable] = useState(true)
  const [openControlId, setOpenControlId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (groupFilter && c.controlGroup !== groupFilter) return false
      if (showOnlyApplicable) {
        const { applies } = appliesAtCategory(c, systemCategory)
        if (!applies) return false
      }
      return true
    })
  }, [controls, groupFilter, showOnlyApplicable, systemCategory])

  const groups = useMemo(
    () => Array.from(new Set(controls.map((c) => c.controlGroup).filter(Boolean))) as string[],
    [controls]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
      </div>
    )
  }

  if (controls.length === 0) {
    return (
      <Card title="Controls">
        <p className="text-sm text-zinc-500">
          The ENS catalogue isn't seeded in this workspace yet. Run the database
          migrations and seed the framework via the admin panel.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card title={`ENS catalogue (${filtered.length} of ${controls.length})`}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div>
            <Label>Group</Label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">All groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-5 flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={showOnlyApplicable}
              onChange={(e) => setShowOnlyApplicable(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-primary-400"
            />
            Only applicable to {CATEGORY_LABEL[systemCategory]}
          </label>
        </div>
        <div className="divide-y divide-zinc-800">
          {filtered.map((c) => {
            const r = resultByControl.get(c.id)
            const ap = appliesAtCategory(c, systemCategory)
            const isOpen = openControlId === c.id
            return (
              <div key={c.id} className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenControlId(isOpen ? null : c.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-800/40"
                >
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                    {c.controlId}
                  </span>
                  <span className="flex-1 text-sm text-zinc-200 truncate">
                    {c.title}
                  </span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    {ap.cell}
                  </span>
                  {c.aappOnly ? (
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                      AAPP
                    </span>
                  ) : null}
                  {r?.audited ? (
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Audited{r.maturity_level ? ` · ${r.maturity_level}` : ''}
                    </span>
                  ) : r ? (
                    <span className="rounded-md bg-zinc-700/50 px-2 py-0.5 text-[10px] text-zinc-400">
                      In progress
                    </span>
                  ) : null}
                </button>
                {isOpen && (
                  <ControlEditor
                    workspaceId={workspaceId}
                    auditId={auditId}
                    control={c}
                    result={r ?? null}
                    systemCategory={systemCategory}
                  />
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">
              No controls match the current filter.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

function ControlEditor({
  workspaceId,
  auditId,
  control,
  result,
  systemCategory,
}: {
  workspaceId: string | undefined
  auditId: string
  control: EnsCatalogueControl
  result: AuditResult | null
  systemCategory: SystemCategory
}) {
  const upsert = useUpsertAuditResult(workspaceId, auditId)
  const { data: aspectsData } = useAspectResults(
    workspaceId,
    auditId,
    result?.id
  )
  const upsertAspects = useUpsertAspectResults(workspaceId, auditId, result?.id)

  const ap = appliesAtCategory(control, systemCategory)
  const [applies, setApplies] = useState(result ? Boolean(result.applies) : ap.applies)
  const [appliesJustification, setAppliesJustification] = useState(
    result?.applies_justification ?? ''
  )
  const [audited, setAudited] = useState(result ? Boolean(result.audited) : false)
  const [maturity, setMaturity] = useState<string>(result?.maturity_level ?? '')
  const [notes, setNotes] = useState(result?.implementation_notes ?? '')

  const checkedMap = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const a of aspectsData?.aspects ?? []) {
      m.set(a.aspect_id, Boolean(a.checked))
    }
    return m
  }, [aspectsData])

  const [pendingAspects, setPendingAspects] = useState<Map<string, boolean>>(new Map())

  const aspectChecked = (aspectId: string) =>
    pendingAspects.has(aspectId)
      ? pendingAspects.get(aspectId)!
      : checkedMap.get(aspectId) ?? false

  const toggleAspect = (aspectId: string) => {
    setPendingAspects((prev) => {
      const next = new Map(prev)
      next.set(aspectId, !aspectChecked(aspectId))
      return next
    })
  }

  const saveResult = async () => {
    if (!applies && !appliesJustification.trim()) return
    await upsert.mutateAsync({
      controlId: control.id,
      applies,
      appliesJustification: applies ? undefined : appliesJustification.trim(),
      audited,
      maturityLevel: (maturity || null) as never,
      implementationNotes: notes,
    })
  }

  const saveAspects = async () => {
    if (!result) return
    if (pendingAspects.size === 0) return
    await upsertAspects.mutateAsync(
      Array.from(pendingAspects.entries()).map(([aspectId, checked]) => ({
        aspectId,
        checked,
      }))
    )
    setPendingAspects(new Map())
  }

  return (
    <div className="mt-2 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={applies}
            onChange={(e) => setApplies(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-primary-400"
          />
          Applies
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={audited}
            onChange={(e) => setAudited(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-primary-400"
          />
          Audited
        </label>
        <div>
          <Label>Maturity</Label>
          <select
            value={maturity}
            onChange={(e) => setMaturity(e.target.value)}
            className={selectClass}
          >
            <option value="">—</option>
            <option value="L0">L0 — Inexistente</option>
            <option value="L1">L1 — Inicial</option>
            <option value="L2">L2 — Repetible</option>
            <option value="L3">L3 — Definido</option>
            <option value="L4">L4 — Gestionado</option>
            <option value="L5">L5 — Optimizado</option>
          </select>
        </div>
      </div>

      {!applies && (
        <Textarea
          label="Justification (required when n.a.)"
          value={appliesJustification}
          onChange={setAppliesJustification}
          rows={2}
        />
      )}

      <Textarea
        label="Implementation notes"
        value={notes}
        onChange={setNotes}
        rows={3}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveResult}
          disabled={upsert.isPending || (!applies && !appliesJustification.trim())}
          className={btnPrimary}
        >
          {upsert.isPending ? 'Saving…' : 'Save result'}
        </button>
      </div>

      {control.evaluatedAspects.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Audit checklist ({control.evaluatedAspects.length})
            </h4>
            {result && pendingAspects.size > 0 && (
              <button
                type="button"
                onClick={saveAspects}
                disabled={upsertAspects.isPending}
                className="rounded-md bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300"
              >
                Save {pendingAspects.size} change{pendingAspects.size === 1 ? '' : 's'}
              </button>
            )}
          </div>
          {!result ? (
            <p className="text-xs text-zinc-500">
              Save the result first to enable per-question checkboxes.
            </p>
          ) : (
            <ul className="space-y-2">
              {control.evaluatedAspects.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-900/60"
                >
                  <input
                    type="checkbox"
                    checked={aspectChecked(a.id)}
                    onChange={() => toggleAspect(a.id)}
                    className="mt-1 rounded border-zinc-700 bg-zinc-900 text-primary-400"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-300">{a.question}</p>
                    {a.reinforcement_ref && (
                      <span className="mt-1 inline-block rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                        {a.reinforcement_ref}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Findings tab ──────────────────────────────────────────────

function FindingsTab({
  workspaceId,
  auditId,
}: {
  workspaceId: string | undefined
  auditId: string
}) {
  const { data } = useFindings(workspaceId, auditId)
  const findings = data?.findings ?? []
  const createMut = useCreateFinding(workspaceId, auditId)
  const updateMut = useUpdateFinding(workspaceId, auditId)
  const deleteMut = useDeleteFinding(workspaceId, auditId)

  const [severity, setSeverity] = useState<Severity>('NO_CONFORMIDAD_MENOR')
  const [description, setDescription] = useState('')
  const [recommendation, setRecommendation] = useState('')

  const submit = async () => {
    if (!description.trim()) return
    await createMut.mutateAsync({
      severity,
      description: description.trim(),
      recommendation: recommendation.trim() || undefined,
    })
    setDescription('')
    setRecommendation('')
  }

  return (
    <div className="space-y-4">
      <Card title="New finding">
        <div className="space-y-3">
          <div>
            <Label>Severity</Label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className={selectClass}
            >
              <option value="NO_CONFORMIDAD_MAYOR">No conformidad mayor</option>
              <option value="NO_CONFORMIDAD_MENOR">No conformidad menor</option>
              <option value="OBSERVACION">Observación</option>
              <option value="PUNTO_DE_MEJORA">Punto de mejora</option>
            </select>
          </div>
          <Textarea label="Description" value={description} onChange={setDescription} rows={3} />
          <Textarea label="Recommendation" value={recommendation} onChange={setRecommendation} rows={2} />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={!description.trim() || createMut.isPending}
              className={btnPrimary}
            >
              Add finding
            </button>
          </div>
        </div>
      </Card>

      <Card title={`Findings (${findings.length})`}>
        {findings.length === 0 ? (
          <p className="text-sm text-zinc-500">No findings recorded.</p>
        ) : (
          <ul className="space-y-3">
            {findings.map((f) => (
              <FindingRow
                key={f.id}
                workspaceId={workspaceId}
                auditId={auditId}
                finding={f}
                onStatusChange={(status) =>
                  updateMut.mutate({ findingId: f.id, status })
                }
                onDelete={() => deleteMut.mutate(f.id)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function FindingRow({
  workspaceId,
  auditId,
  finding,
  onStatusChange,
  onDelete,
}: {
  workspaceId: string | undefined
  auditId: string
  finding: Finding
  onStatusChange: (status: Finding['status']) => void
  onDelete: () => void
}) {
  const [pacOpen, setPacOpen] = useState(false)
  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
            {finding.display_id}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${SEVERITY_LABEL[finding.severity].color}`}
          >
            {SEVERITY_LABEL[finding.severity].label}
          </span>
          {finding.pac_required ? (
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              PAC required
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={finding.status}
            onChange={(e) => onStatusChange(e.target.value as Finding['status'])}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
          >
            <option value="open">Open</option>
            <option value="in_remediation">In remediation</option>
            <option value="remediated">Remediated</option>
            <option value="validated">Validated</option>
            <option value="accepted">Accepted</option>
            <option value="closed">Closed</option>
          </select>
          <button
            type="button"
            onClick={onDelete}
            className="text-zinc-500 hover:text-red-400"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-300">{finding.description}</p>
      {finding.recommendation && (
        <p className="mt-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">Recomendación:</span>{' '}
          {finding.recommendation}
        </p>
      )}
      {finding.pac_required ? (
        <div className="mt-3 border-t border-zinc-800 pt-2">
          <button
            type="button"
            onClick={() => setPacOpen((v) => !v)}
            className="text-xs font-medium text-primary-400 hover:text-primary-300"
          >
            {pacOpen ? 'Hide PAC' : 'Edit PAC'}
          </button>
          {pacOpen && (
            <PacEditor
              workspaceId={workspaceId}
              auditId={auditId}
              findingId={finding.id}
            />
          )}
        </div>
      ) : null}
    </li>
  )
}

function PacEditor({
  workspaceId,
  auditId,
  findingId,
}: {
  workspaceId: string | undefined
  auditId: string
  findingId: string
}) {
  const { data, isLoading } = usePac(workspaceId, auditId, findingId)
  const upsert = useUpsertPac(workspaceId, auditId, findingId)
  const pac = (data?.pac ?? null) as Record<string, string | null> | null

  const [analysis, setAnalysis] = useState('')
  const [proposedRemediation, setProposedRemediation] = useState('')
  const [executionEvidence, setExecutionEvidence] = useState('')
  const [effectivenessCheck, setEffectivenessCheck] = useState('')
  const [responsibleParty, setResponsibleParty] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('proposed')
  const [hydrated, setHydrated] = useState(false)

  if (!hydrated && pac) {
    setAnalysis(((pac.analysis ?? '') as string) || '')
    setProposedRemediation(((pac.proposed_remediation ?? '') as string) || '')
    setExecutionEvidence(((pac.execution_evidence ?? '') as string) || '')
    setEffectivenessCheck(((pac.effectiveness_check ?? '') as string) || '')
    setResponsibleParty(((pac.responsible_party ?? '') as string) || '')
    setDueDate(((pac.due_date ?? '') as string) || '')
    setStatus(((pac.status ?? 'proposed') as string) || 'proposed')
    setHydrated(true)
  } else if (!hydrated && !isLoading && !pac) {
    setHydrated(true)
  }

  const save = async () => {
    await upsert.mutateAsync({
      analysis,
      proposedRemediation,
      executionEvidence,
      effectivenessCheck,
      responsibleParty,
      dueDate: dueDate || undefined,
      status,
    })
  }

  if (isLoading) {
    return (
      <div className="mt-3 flex justify-center py-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Responsible party" value={responsibleParty} onChange={setResponsibleParty} />
        <div>
          <Label>Due date</Label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <Textarea label="Root-cause analysis" value={analysis} onChange={setAnalysis} rows={2} />
      <Textarea
        label="Proposed remediation"
        value={proposedRemediation}
        onChange={setProposedRemediation}
        rows={2}
      />
      <Textarea
        label="Execution evidence"
        value={executionEvidence}
        onChange={setExecutionEvidence}
        rows={2}
      />
      <Textarea
        label="Effectiveness check"
        value={effectivenessCheck}
        onChange={setEffectivenessCheck}
        rows={2}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="proposed">Proposed</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="validated">Validated</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={upsert.isPending}
          className={btnPrimary}
        >
          {upsert.isPending ? 'Saving…' : 'Save PAC'}
        </button>
      </div>
    </div>
  )
}

// ── Quality tab ───────────────────────────────────────────────

function QualityTab({
  workspaceId,
  auditId,
}: {
  workspaceId: string | undefined
  auditId: string
}) {
  const { data } = useQualityFlags(workspaceId, auditId)
  const flags = data?.flags ?? []

  if (flags.length === 0) {
    return (
      <Card title="Data quality">
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          No inconsistencies detected on findings.
        </div>
      </Card>
    )
  }

  return (
    <Card title={`Data quality issues (${flags.length})`}>
      <ul className="space-y-2">
        {flags.map((f) => (
          <li
            key={f.finding_id}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <HugeiconsIcon icon={AlertCircleIcon} size={14} />
              <span className="text-xs font-mono">{f.display_id}</span>
              <span className="text-xs">— {SEVERITY_LABEL[f.severity].label}</span>
            </div>
            <ul className="mt-1.5 space-y-0.5 pl-5 text-[11px] text-zinc-400">
              {f.flag_severity_display_mismatch ? (
                <li>Display ID prefix doesn't match severity (SEVERITY_DISPLAY_MISMATCH).</li>
              ) : null}
              {f.flag_exec_summary_missing_per_control_finding ? (
                <li>Finding not surfaced in executive summary (EXEC_SUMMARY_MISSING_PER_CONTROL_FINDING).</li>
              ) : null}
              {f.flag_existen_false_but_category_checked ? (
                <li>EXISTEN unchecked but a category was assigned (EXISTEN_FALSE_BUT_CATEGORY_CHECKED).</li>
              ) : null}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Shared primitives ─────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none'
const selectClass = `${inputClass} cursor-pointer`
const btnPrimary =
  'rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:cursor-not-allowed disabled:opacity-50'
const btnSecondary =
  'rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-zinc-400">{children}</label>
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}

function Textarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={inputClass}
      />
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-3 text-sm font-semibold text-zinc-200">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/60 py-1.5 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? 'border-primary-400 text-zinc-100'
          : 'border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
