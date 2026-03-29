import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon, Shield01Icon, UserGroupIcon, Link01Icon, Layers01Icon, CheckmarkCircle01Icon, LoaderPinwheelIcon, Alert02Icon, Mail01Icon, Key01Icon, } from '@hugeicons/core-free-icons';
import { api } from '@/lib/api';
import { IntegrationsPage } from '@/pages/integrations';
import { useWorkspace, useInviteMember, useUpdateMemberRole, useRemoveMember, useDirectInvitations, useCancelInvitation, } from '@/hooks/use-workspace';
import { useInvitations, useApproveInvitation, useRejectInvitation, } from '@/hooks/use-invitations';
import { useCustomFieldDefinitions, useCreateCustomField, useDeleteCustomField, useWorkspaceSetting, useUpdateWorkspaceSetting, useSystemLibrary, useAddFromLibrary, useSystemsList, useEmployeeLibrary, } from '@/hooks/use-compliance';
import { useBaselineLibrary, useAddFromBaselineLibrary, useBaselines, } from '@/hooks/use-settings';
function useSettings(workspaceId) {
    return useQuery({
        queryKey: ['settings', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/settings`),
        enabled: !!workspaceId,
    });
}
function useUpdateSetting(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/settings`, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] });
            // Refresh provider status when a provider key or key source is saved
            if (variables.key.startsWith('ai.provider_key.') || variables.key.startsWith('ai.key_source.')) {
                queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] });
            }
        },
    });
}
function useAIProviders(workspaceId) {
    return useQuery({
        queryKey: ['ai-providers', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/settings/ai-providers`),
        enabled: !!workspaceId,
    });
}
// Model options per provider
const PROVIDER_MODELS = {
    anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250514'],
    'google-gemini': ['gemini-2.5-pro', 'gemini-2.5-flash'],
    openai: ['gpt-5', 'gpt-5-mini'],
};
// AI setting keys and their defaults
const AI_SETTINGS = [
    {
        key: 'ai.model',
        label: 'AI Model',
        description: 'The model used for the chat assistant',
        default: 'claude-sonnet-4-20250514',
        type: 'select',
        options: [],
    },
    {
        key: 'ai.max_tokens',
        label: 'Max Response Tokens',
        description: 'Maximum number of tokens in AI responses',
        default: '4096',
        type: 'number',
    },
    {
        key: 'ai.temperature',
        label: 'Temperature',
        description: 'Controls randomness (0.0 = deterministic, 1.0 = creative)',
        default: '0.3',
        type: 'number',
    },
    {
        key: 'ai.system_prompt',
        label: 'Custom System Prompt',
        description: 'Override the default AI system prompt. Workspace context is always appended automatically.',
        default: '',
        type: 'textarea',
    },
];
export function SettingsPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const { workspace } = useWorkspace(workspaceId);
    const { data: settingsData, isLoading } = useSettings(workspaceId);
    const { data: aiProvidersData } = useAIProviders(workspaceId);
    const updateSetting = useUpdateSetting(workspaceId);
    const [activeTab, setActiveTab] = useState('members');
    const [localValues, setLocalValues] = useState({});
    const [savedKeys, setSavedKeys] = useState(new Set());
    // Initialize local values from server settings
    useEffect(() => {
        if (settingsData?.settings) {
            const values = {};
            for (const setting of settingsData.settings) {
                values[setting.key] = setting.value;
            }
            setLocalValues(values);
        }
    }, [settingsData]);
    const getValue = (key, defaultValue) => localValues[key] ?? defaultValue;
    const allAIProviders = aiProvidersData?.providers ?? [];
    const activeAIProviders = aiProvidersData?.activeProviders ?? [];
    const hasActiveAIProvider = aiProvidersData?.hasActiveProvider ?? false;
    // Check effective key source per provider (local override or server value)
    const getKeySource = (p) => (localValues[`ai.key_source.${p.slug}`] ?? p.keySource);
    // A provider is "ready" if it has a key available based on key source
    const isProviderReady = (p) => {
        const source = getKeySource(p);
        if (source === 'platform')
            return p.hasAdminKey;
        return p.hasUserKey;
    };
    // Only show models for providers that are active AND have a key available
    const modelOptions = [];
    for (const p of activeAIProviders) {
        if (isProviderReady(p)) {
            modelOptions.push(...(PROVIDER_MODELS[p.slug] ?? []));
        }
    }
    // Providers where user needs to provide a key (key_source=user, or platform but no admin key)
    const providersNeedingKey = activeAIProviders.filter((p) => getKeySource(p) === 'user' || !p.hasAdminKey);
    const handleSave = async (key, value) => {
        await updateSetting.mutateAsync({ key, value });
        setSavedKeys((prev) => new Set([...prev, key]));
        setTimeout(() => setSavedKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        }), 2000);
    };
    const tabs = [
        { id: 'members', label: 'Members', icon: UserGroupIcon },
        { id: 'libraries', label: 'Libraries', icon: Layers01Icon },
        { id: 'integrations', label: 'Integrations', icon: Link01Icon },
        { id: 'access-fields', label: 'Custom Fields', icon: Key01Icon },
        { id: 'ai', label: 'AI Configuration', icon: Shield01Icon },
        { id: 'general', label: 'General', icon: Settings01Icon },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Settings" }), _jsxs("p", { className: "mt-1 text-sm text-zinc-400", children: ["Configure workspace settings for ", workspace?.name ?? 'your workspace', "."] })] }), _jsx("div", { className: "overflow-x-auto -mx-4 px-4", children: _jsx("div", { className: "flex gap-1 rounded-lg bg-zinc-900 p-1 min-w-max", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-300'}`, children: [_jsx(HugeiconsIcon, { icon: tab.icon, size: 16 }), _jsx("span", { className: "hidden sm:inline", children: tab.label }), _jsx("span", { className: "sm:hidden", children: tab.label.split(' ')[0] })] }, tab.id))) }) }), activeTab === 'ai' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "AI Assistant Configuration" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Configure the AI model, behavior, and system prompt for the chat assistant. These settings affect all users in this workspace." }), isLoading ? (_jsx("div", { className: "mt-6 flex justify-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-zinc-500" }) })) : (_jsx("div", { className: "mt-6 space-y-6", children: AI_SETTINGS.map((setting) => {
                                    const currentValue = getValue(setting.key, setting.default);
                                    const isSaved = savedKeys.has(setting.key);
                                    const effectiveOptions = (setting.key === 'ai.model' ? modelOptions : setting.options) ?? [];
                                    return (_jsxs("div", { className: "border-b border-zinc-800 pb-6 last:border-0 last:pb-0", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-zinc-200", children: setting.label }), _jsx("p", { className: "mt-0.5 text-xs text-zinc-500", children: setting.description })] }), isSaved && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-primary-400", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 14 }), "Saved"] }))] }), _jsxs("div", { className: "mt-3 flex items-end gap-3", children: [setting.type === 'select' ? (_jsx("select", { value: currentValue, onChange: (e) => setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value })), disabled: effectiveOptions.length === 0, className: "flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: effectiveOptions?.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })) : setting.type === 'textarea' ? (_jsx("textarea", { value: currentValue, onChange: (e) => setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value })), rows: 6, placeholder: "Leave empty to use the default system prompt. Workspace context is always appended.", className: "flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })) : (_jsx("input", { type: "text", value: currentValue, onChange: (e) => setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value })), className: "w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })), _jsx("button", { onClick: () => handleSave(setting.key, currentValue), disabled: updateSetting.isPending, className: "shrink-0 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: "Save" })] }), setting.default && (_jsxs("p", { className: "mt-2 text-xs text-zinc-600", children: ["Default: ", _jsx("code", { className: "rounded bg-zinc-800 px-1 py-0.5 text-zinc-500", children: setting.default })] }))] }, setting.key));
                                }) }))] }), activeAIProviders.length > 0 ? (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Key01Icon, size: 18, className: "text-zinc-400" }), _jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "API Keys" })] }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Choose whether each provider uses the platform key (set by admin) or a workspace-specific key." }), _jsx("div", { className: "mt-4 space-y-5", children: activeAIProviders.map((provider) => {
                                    const sourceKey = `ai.key_source.${provider.slug}`;
                                    const keySettingKey = `ai.provider_key.${provider.slug}`;
                                    const currentSource = getKeySource(provider);
                                    const currentKey = getValue(keySettingKey, '');
                                    const isKeySaved = savedKeys.has(keySettingKey);
                                    const isSourceSaved = savedKeys.has(sourceKey);
                                    return (_jsxs("div", { className: "border-b border-zinc-800 pb-5 last:border-0 last:pb-0", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2 w-2 rounded-full ${isProviderReady(provider) ? 'bg-primary-400' : 'bg-zinc-600'}` }), _jsx("label", { className: "text-sm font-medium text-zinc-200", children: provider.name }), (isSourceSaved || isKeySaved) && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-primary-400", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 14 }), "Saved"] }))] }) }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx("button", { onClick: () => {
                                                            setLocalValues((prev) => ({ ...prev, [sourceKey]: 'platform' }));
                                                            handleSave(sourceKey, 'platform');
                                                        }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${currentSource === 'platform'
                                                            ? 'bg-primary-400/15 text-primary-400 border border-primary-400/30'
                                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}`, children: "Use platform key" }), _jsx("button", { onClick: () => {
                                                            setLocalValues((prev) => ({ ...prev, [sourceKey]: 'user' }));
                                                            handleSave(sourceKey, 'user');
                                                        }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${currentSource === 'user'
                                                            ? 'bg-blue-400/15 text-blue-400 border border-blue-400/30'
                                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}`, children: "Use own key" })] }), currentSource === 'platform' ? (_jsx("p", { className: "mt-2 text-xs text-zinc-500", children: provider.hasAdminKey
                                                    ? 'Using the API key configured by the platform admin.'
                                                    : 'No platform key configured. Ask a super admin to set it in Admin > Providers.' })) : (_jsxs("div", { className: "mt-2", children: [_jsx("p", { className: "text-xs text-zinc-500 mb-2", children: provider.hasUserKey
                                                            ? 'Using your workspace API key.'
                                                            : 'Enter your own API key for this provider.' }), _jsxs("div", { className: "flex items-end gap-3", children: [_jsx("input", { type: "password", value: currentKey, onChange: (e) => setLocalValues((prev) => ({ ...prev, [keySettingKey]: e.target.value })), placeholder: "sk-...", className: "flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" }), _jsx("button", { onClick: () => handleSave(keySettingKey, currentKey), disabled: updateSetting.isPending, className: "shrink-0 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: "Save" })] })] }))] }, provider.slug));
                                }) })] })) : (_jsx("div", { className: "rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(HugeiconsIcon, { icon: Alert02Icon, size: 16, className: "mt-0.5 shrink-0 text-zinc-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-zinc-300", children: "AI Providers" }), _jsxs("p", { className: "mt-1 text-xs text-zinc-500", children: ["No AI provider is active in Admin ", ' > ', " Providers. Enable at least one provider there first."] })] })] }) }))] })), activeTab === 'general' && (_jsx(GeneralSettingsTab, { workspaceId: workspaceId, workspace: workspace })), activeTab === 'members' && (_jsx(MembersTab, { workspaceId: workspaceId })), activeTab === 'access-fields' && (_jsx(AccessFieldsTab, { workspaceId: workspaceId })), activeTab === 'libraries' && (_jsx(LibrariesTab, { workspaceId: workspaceId })), activeTab === 'integrations' && (_jsx(IntegrationsPage, {}))] }));
}
// ── Members Tab Component ──────────────────────────────────────────────────
const ROLE_COLORS = {
    owner: 'bg-primary-400/10 text-primary-400',
    admin: 'bg-blue-500/10 text-blue-400',
    auditor: 'bg-purple-500/10 text-purple-400',
    member: 'bg-zinc-700/50 text-zinc-300',
    viewer: 'bg-zinc-800 text-zinc-500',
};
// ── General Settings Tab ────────────────────────────────────────────────────
function GeneralSettingsTab({ workspaceId, workspace }) {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '' });
    const [saved, setSaved] = useState(false);
    const updateMut = useMutation({
        mutationFn: (payload) => api.patch(`/workspaces/${workspaceId}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        },
    });
    const startEdit = () => {
        setForm({ name: workspace?.name ?? '', slug: workspace?.slug ?? '' });
        setEditing(true);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Workspace Details" }), _jsx("p", { className: "mt-0.5 text-xs text-zinc-500", children: "Your workspace name and identifier" })] }), !editing && (_jsxs("button", { onClick: startEdit, className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: Settings01Icon, size: 14 }), "Edit"] }))] }), saved && (_jsx("div", { className: "mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-2.5", children: _jsxs("p", { className: "text-xs text-primary-400 flex items-center gap-1", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 14 }), "Workspace updated successfully"] }) })), editing ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Workspace Name" }), _jsx("input", { type: "text", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", placeholder: "Your workspace name" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Slug" }), _jsx("input", { type: "text", value: form.slug, onChange: (e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", placeholder: "your-workspace-slug" }), _jsx("p", { className: "mt-1 text-[10px] text-zinc-500", children: "Used in URLs and the Trust Center. Only lowercase letters, numbers, and hyphens." })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setEditing(false), className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600", children: "Cancel" }), _jsx("button", { onClick: () => updateMut.mutate({ name: form.name, slug: form.slug }), disabled: !form.name.trim() || !form.slug.trim() || updateMut.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: updateMut.isPending ? 'Saving...' : 'Save Changes' })] })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3", children: [_jsx("span", { className: "text-sm text-zinc-400", children: "Name" }), _jsx("span", { className: "text-sm font-medium text-zinc-100", children: workspace?.name ?? '—' })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3", children: [_jsx("span", { className: "text-sm text-zinc-400", children: "Slug" }), _jsx("code", { className: "rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300", children: workspace?.slug ?? '—' })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3", children: [_jsx("span", { className: "text-sm text-zinc-400", children: "Plan" }), _jsx("span", { className: `rounded-md px-2 py-0.5 text-xs font-medium ${workspace?.plan === 'enterprise' ? 'bg-primary-400/10 text-primary-400' :
                                            workspace?.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                                                workspace?.plan === 'starter' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-zinc-800 text-zinc-400'}`, children: workspace?.plan ?? 'free' })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3", children: [_jsx("span", { className: "text-sm text-zinc-400", children: "Created" }), _jsx("span", { className: "text-xs text-zinc-500", children: workspace?.createdAt ? new Date(workspace.createdAt).toLocaleString() : '—' })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3", children: [_jsx("span", { className: "text-sm text-zinc-400", children: "Workspace ID" }), _jsx("code", { className: "rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400", children: workspaceId })] })] }))] }), _jsxs("div", { className: "rounded-xl border border-red-500/20 bg-red-500/5 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-red-400", children: "Danger Zone" }), _jsx("p", { className: "mt-1 text-xs text-zinc-500", children: "These actions are irreversible. Please be certain." }), _jsxs("div", { className: "mt-4", children: [_jsx("button", { disabled: true, className: "rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 opacity-50 cursor-not-allowed", children: "Delete Workspace" }), _jsx("p", { className: "mt-1 text-[10px] text-zinc-600", children: "Contact a super admin to delete this workspace." })] })] })] }));
}
const ASSIGNABLE_ROLES = ['admin', 'auditor', 'member', 'viewer'];
function MembersTab({ workspaceId }) {
    const { members, role } = useWorkspace(workspaceId);
    const userId = localStorage.getItem('userId');
    // Invitation requests (user-initiated)
    const { data: invitationsData, isLoading: invLoading } = useInvitations(workspaceId);
    const approveInvitation = useApproveInvitation(workspaceId);
    const rejectInvitation = useRejectInvitation(workspaceId);
    const pendingRequests = invitationsData?.invitations?.filter((i) => i.status === 'pending') ?? [];
    // Direct invitations (admin-sent)
    const { invitations: directInvitations } = useDirectInvitations(workspaceId);
    const inviteMember = useInviteMember(workspaceId);
    const cancelInvitation = useCancelInvitation(workspaceId);
    // Member management
    const updateRole = useUpdateMemberRole(workspaceId);
    const removeMember = useRemoveMember(workspaceId);
    const [confirmRemove, setConfirmRemove] = useState(null);
    // Invite form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [inviteError, setInviteError] = useState('');
    // Settings
    const { data: settingsData } = useQuery({
        queryKey: ['settings', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/settings`),
        enabled: !!workspaceId,
    });
    const queryClient = useQueryClient();
    const updateSetting = useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/settings`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] });
        },
    });
    const allowInvitations = settingsData?.settings?.find((s) => s.key === 'allow_invitation_requests')?.value !== 'false';
    const isAdmin = role === 'admin' || role === 'owner';
    const handleInvite = () => {
        if (!inviteEmail.trim())
            return;
        setInviteError('');
        setInviteSuccess('');
        inviteMember.mutate({ email: inviteEmail.trim(), role: inviteRole }, {
            onSuccess: () => {
                setInviteSuccess(`Invitation sent to ${inviteEmail}`);
                setInviteEmail('');
                setInviteRole('member');
            },
            onError: (err) => {
                setInviteError(err.message || 'Failed to send invitation');
            },
        });
    };
    const handleRoleChange = (memberId, newRole) => {
        updateRole.mutate({ memberId, role: newRole });
    };
    const handleRemove = (memberId) => {
        removeMember.mutate(memberId, {
            onSuccess: () => setConfirmRemove(null),
        });
    };
    return (_jsxs("div", { className: "space-y-5", children: [isAdmin && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "mb-1 text-sm font-semibold text-zinc-100", children: "Invite Member" }), _jsx("p", { className: "mb-4 text-xs text-zinc-500", children: "Send an email invitation to join this workspace." }), _jsxs("div", { className: "flex items-end gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Email address" }), _jsx("input", { type: "email", value: inviteEmail, onChange: (e) => { setInviteEmail(e.target.value); setInviteError(''); setInviteSuccess(''); }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "colleague@company.com", onKeyDown: (e) => e.key === 'Enter' && handleInvite() })] }), _jsxs("div", { className: "w-36", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Role" }), _jsx("select", { value: inviteRole, onChange: (e) => setInviteRole(e.target.value), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: ASSIGNABLE_ROLES.map((r) => (_jsx("option", { value: r, children: r.charAt(0).toUpperCase() + r.slice(1) }, r))) })] }), _jsx("button", { onClick: handleInvite, disabled: !inviteEmail.trim() || inviteMember.isPending, className: "rounded-lg bg-primary-400 px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: inviteMember.isPending ? 'Sending...' : 'Send Invite' })] }), inviteSuccess && (_jsxs("p", { className: "mt-2 flex items-center gap-1 text-xs text-primary-400", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 12 }), " ", inviteSuccess] })), inviteError && (_jsxs("p", { className: "mt-2 flex items-center gap-1 text-xs text-red-400", children: [_jsx(HugeiconsIcon, { icon: Alert02Icon, size: 12 }), " ", inviteError] }))] })), isAdmin && directInvitations.length > 0 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-100", children: "Pending Invitations" }), _jsxs("p", { className: "mt-0.5 mb-4 text-xs text-zinc-500", children: [directInvitations.length, " invitation", directInvitations.length !== 1 ? 's' : '', " awaiting response"] }), _jsx("div", { className: "space-y-2", children: directInvitations.map((inv) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(HugeiconsIcon, { icon: Mail01Icon, size: 16, className: "text-zinc-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-zinc-200", children: inv.email }), _jsxs("p", { className: "text-xs text-zinc-500", children: [_jsx("span", { className: `rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLORS[inv.role] ?? 'bg-zinc-800 text-zinc-400'}`, children: inv.role }), ' · ', "Expires ", new Date(inv.expiresAt).toLocaleDateString()] })] })] }), _jsx("button", { onClick: () => cancelInvitation.mutate(inv.id), disabled: cancelInvitation.isPending, className: "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-50", children: "Cancel" })] }, inv.id))) })] })), isAdmin && pendingRequests.length > 0 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-100", children: "Join Requests" }), _jsxs("p", { className: "mt-0.5 mb-4 text-xs text-zinc-500", children: [pendingRequests.length, " pending request", pendingRequests.length !== 1 ? 's' : ''] }), _jsx("div", { className: "space-y-2", children: pendingRequests.map((inv) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300", children: inv.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-zinc-200", children: inv.name }), _jsx("p", { className: "text-xs text-zinc-500", children: inv.email })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-zinc-600", children: new Date(inv.createdAt).toLocaleDateString() }), _jsx("button", { onClick: () => rejectInvitation.mutate(inv.id), disabled: rejectInvitation.isPending, className: "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-700 disabled:opacity-50", children: "Reject" }), _jsx("button", { onClick: () => approveInvitation.mutate(inv.id), disabled: approveInvitation.isPending, className: "rounded-lg bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: "Approve" })] })] }, inv.id))) })] })), isAdmin && (_jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-zinc-200", children: "Allow join requests" }), _jsx("p", { className: "mt-0.5 text-xs text-zinc-500", children: "Let users with matching email domains request to join" })] }), _jsx("button", { onClick: () => updateSetting.mutate({ key: 'allow_invitation_requests', value: allowInvitations ? 'false' : 'true' }), disabled: updateSetting.isPending, className: `relative h-6 w-11 rounded-full transition-colors ${allowInvitations ? 'bg-primary-400' : 'bg-zinc-700'}`, children: _jsx("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${allowInvitations ? 'left-[22px]' : 'left-0.5'}` }) })] }) })), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-100", children: "Members" }), _jsxs("p", { className: "mt-0.5 mb-4 text-xs text-zinc-500", children: [members.length, " member", members.length !== 1 ? 's' : ''] }), _jsx("div", { className: "space-y-2", children: members.map((member) => {
                            const isSelf = member.userId === userId;
                            const isOwner = member.role === 'owner';
                            const canEdit = isAdmin && !isOwner && !isSelf;
                            return (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 text-xs font-medium text-zinc-200", children: member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-zinc-200", children: [member.name, isSelf && _jsx("span", { className: "ml-1.5 text-[10px] text-zinc-500", children: "(you)" })] }), _jsx("p", { className: "text-xs text-zinc-500", children: member.email })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [canEdit ? (_jsx("select", { value: member.role, onChange: (e) => handleRoleChange(member.id, e.target.value), disabled: updateRole.isPending, className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: ASSIGNABLE_ROLES.map((r) => (_jsx("option", { value: r, children: r.charAt(0).toUpperCase() + r.slice(1) }, r))) })) : (_jsx("span", { className: `rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-zinc-800 text-zinc-400'}`, children: member.role })), canEdit && (confirmRemove === member.id ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => handleRemove(member.id), disabled: removeMember.isPending, className: "rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20", children: removeMember.isPending ? '...' : 'Confirm' }), _jsx("button", { onClick: () => setConfirmRemove(null), className: "rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400", children: "No" })] })) : (_jsx("button", { onClick: () => setConfirmRemove(member.id), className: "rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400", children: "Remove" })))] })] }, member.id));
                        }) })] })] }));
}
// ── Access Fields Tab Component ─────────────────────────────────────────────
const ENTITY_TYPES = [
    { value: 'person', label: 'People' },
    { value: 'system', label: 'Systems' },
    { value: 'access_record', label: 'Access Records' },
];
const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select (dropdown)' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Yes/No' },
];
function AccessFieldsTab({ workspaceId }) {
    const { fields, isLoading } = useCustomFieldDefinitions(workspaceId);
    const createMutation = useCreateCustomField(workspaceId);
    const deleteMutation = useDeleteCustomField(workspaceId);
    const updateSettingMutation = useUpdateWorkspaceSetting(workspaceId);
    // Environment options
    const { value: envSettingRaw } = useWorkspaceSetting(workspaceId, 'system_environments');
    const envOptions = envSettingRaw
        ? (() => { try {
            return JSON.parse(envSettingRaw);
        }
        catch {
            return [];
        } })()
        : ['Production', 'Staging', 'Development', 'Testing'];
    const [envInput, setEnvInput] = useState('');
    const [localEnvs, setLocalEnvs] = useState(null);
    const displayEnvs = localEnvs ?? envOptions;
    const addEnv = () => {
        if (!envInput.trim())
            return;
        const updated = [...displayEnvs, envInput.trim()];
        setLocalEnvs(updated);
        updateSettingMutation.mutate({ key: 'system_environments', value: JSON.stringify(updated) });
        setEnvInput('');
    };
    const removeEnv = (idx) => {
        const updated = displayEnvs.filter((_, i) => i !== idx);
        setLocalEnvs(updated);
        updateSettingMutation.mutate({ key: 'system_environments', value: JSON.stringify(updated) });
    };
    // New field form
    const [showFieldForm, setShowFieldForm] = useState(false);
    const [fieldForm, setFieldForm] = useState({
        entityType: 'person',
        fieldName: '',
        fieldLabel: '',
        fieldType: 'text',
        fieldOptions: '',
        required: false,
    });
    const handleCreateField = () => {
        if (!fieldForm.fieldName.trim() || !fieldForm.fieldLabel.trim())
            return;
        createMutation.mutate({
            entityType: fieldForm.entityType,
            fieldName: fieldForm.fieldName.replace(/\s+/g, '_').toLowerCase(),
            fieldLabel: fieldForm.fieldLabel,
            fieldType: fieldForm.fieldType,
            fieldOptions: fieldForm.fieldType === 'select'
                ? fieldForm.fieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
                : undefined,
            required: fieldForm.required,
        }, {
            onSuccess: () => {
                setFieldForm({ entityType: 'person', fieldName: '', fieldLabel: '', fieldType: 'text', fieldOptions: '', required: false });
                setShowFieldForm(false);
            },
        });
    };
    // Group fields by entity type
    const grouped = ENTITY_TYPES.map((et) => ({
        ...et,
        fields: fields.filter((f) => f.entityType === et.value),
    }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "System Environment Options" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Configure the environment values available in the Systems dropdown." }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: displayEnvs.map((env, idx) => (_jsxs("span", { className: "flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300", children: [env, _jsx("button", { onClick: () => removeEnv(idx), className: "text-zinc-500 hover:text-red-400", children: "x" })] }, idx))) }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("input", { value: envInput, onChange: (e) => setEnvInput(e.target.value), onKeyDown: (e) => e.key === 'Enter' && addEnv(), className: "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "New environment..." }), _jsx("button", { onClick: addEnv, disabled: !envInput.trim(), className: "rounded-lg bg-primary-400 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: "Add" })] })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Custom Fields" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Define custom fields for People, Systems, and Access Records." })] }), _jsx("button", { onClick: () => setShowFieldForm(!showFieldForm), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300", children: showFieldForm ? 'Cancel' : 'Add Field' })] }), showFieldForm && (_jsxs("div", { className: "mt-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Entity Type *" }), _jsx("select", { value: fieldForm.entityType, onChange: (e) => setFieldForm({ ...fieldForm, entityType: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: ENTITY_TYPES.map((et) => (_jsx("option", { value: et.value, children: et.label }, et.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Field Label *" }), _jsx("input", { value: fieldForm.fieldLabel, onChange: (e) => {
                                                    setFieldForm({
                                                        ...fieldForm,
                                                        fieldLabel: e.target.value,
                                                        fieldName: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                                                    });
                                                }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Team, License Tier" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Field Type *" }), _jsx("select", { value: fieldForm.fieldType, onChange: (e) => setFieldForm({ ...fieldForm, fieldType: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: FIELD_TYPES.map((ft) => (_jsx("option", { value: ft.value, children: ft.label }, ft.value))) })] }), fieldForm.fieldType === 'select' && (_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Options (comma-separated)" }), _jsx("input", { value: fieldForm.fieldOptions, onChange: (e) => setFieldForm({ ...fieldForm, fieldOptions: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Engineering, Marketing, Sales" })] })), _jsx("div", { className: "flex items-end", children: _jsxs("label", { className: "flex items-center gap-2 text-sm text-zinc-300", children: [_jsx("input", { type: "checkbox", checked: fieldForm.required, onChange: (e) => setFieldForm({ ...fieldForm, required: e.target.checked }), className: "rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400" }), "Required"] }) })] }), _jsx("div", { className: "mt-3 flex justify-end", children: _jsx("button", { onClick: handleCreateField, disabled: !fieldForm.fieldLabel.trim() || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Create Field' }) })] })), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) })) : fields.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-zinc-500", children: "No custom fields defined yet." })) : (_jsx("div", { className: "mt-4 space-y-4", children: grouped
                            .filter((g) => g.fields.length > 0)
                            .map((group) => (_jsxs("div", { children: [_jsx("h3", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500", children: group.label }), _jsx("div", { className: "divide-y divide-zinc-800 rounded-lg border border-zinc-800", children: group.fields.map((field) => (_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-zinc-200", children: field.fieldLabel }), _jsxs("p", { className: "text-xs text-zinc-500", children: [field.fieldName, " \u00B7 ", field.fieldType, field.required && ' &middot; required', field.fieldOptions && ` &middot; ${field.fieldOptions.length} options`] })] }), _jsx("button", { onClick: () => {
                                                    if (confirm(`Delete custom field "${field.fieldLabel}"? This will remove all values.`)) {
                                                        deleteMutation.mutate(field.id);
                                                    }
                                                }, className: "text-xs text-red-400 hover:text-red-300", children: "Delete" })] }, field.id))) })] }, group.value))) }))] })] }));
}
function LibrariesTab({ workspaceId }) {
    const [subTab, setSubTab] = useState('systems');
    const SUB_TABS = [
        { id: 'systems', label: 'Systems' },
        { id: 'baselines', label: 'Baselines' },
        { id: 'roles', label: 'Departments & Roles' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-800/50 p-1", children: SUB_TABS.map((t) => (_jsx("button", { onClick: () => setSubTab(t.id), className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${subTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: t.label }, t.id))) }), subTab === 'systems' && _jsx(SystemsLibraryTab, { workspaceId: workspaceId }), subTab === 'baselines' && _jsx(BaselinesLibraryTab, { workspaceId: workspaceId }), subTab === 'roles' && _jsx(RolesLibraryTab, { workspaceId: workspaceId })] }));
}
// ── Systems Library Tab Component ─────────────────────────────────────────────
const CATEGORY_LABELS = {
    identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
    cloud: { label: 'Cloud Infrastructure', color: 'bg-purple-500/10 text-purple-400' },
    devops: { label: 'DevOps & Development', color: 'bg-amber-500/10 text-amber-400' },
    communication: { label: 'Communication', color: 'bg-primary-400/10 text-primary-400' },
    project: { label: 'Project Management', color: 'bg-cyan-500/10 text-cyan-400' },
    security: { label: 'Security & Compliance', color: 'bg-red-500/10 text-red-400' },
    data: { label: 'Data & Analytics', color: 'bg-indigo-500/10 text-indigo-400' },
    crm: { label: 'CRM & Sales', color: 'bg-orange-500/10 text-orange-400' },
    hr: { label: 'HR & Finance', color: 'bg-pink-500/10 text-pink-400' },
};
function SystemsLibraryTab({ workspaceId }) {
    const { library, isLoading: libLoading } = useSystemLibrary(workspaceId);
    const { systems: existingSystems } = useSystemsList(workspaceId);
    const addFromLibrary = useAddFromLibrary(workspaceId);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');
    const [result, setResult] = useState(null);
    const existingNames = new Set(existingSystems.map((s) => s.name.toLowerCase()));
    // Group by category
    const categories = Array.from(new Set(library.map((s) => s.category)));
    const filtered = library.filter((s) => {
        if (categoryFilter && s.category !== categoryFilter)
            return false;
        if (search) {
            const q = search.toLowerCase();
            return s.name.toLowerCase().includes(q) || (s.vendor ?? '').toLowerCase().includes(q);
        }
        return true;
    });
    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id))
            next.delete(id);
        else
            next.add(id);
        setSelectedIds(next);
    };
    const handleAdd = () => {
        if (selectedIds.size === 0)
            return;
        addFromLibrary.mutate({ libraryIds: Array.from(selectedIds) }, {
            onSuccess: (data) => {
                setResult({ created: data.created, skipped: data.skipped });
                setSelectedIds(new Set());
            },
        });
    };
    if (libLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsx("div", { className: "space-y-5", children: _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-100", children: "Systems Library" }), _jsx("p", { className: "mt-0.5 mb-4 text-xs text-zinc-500", children: "Browse common enterprise tools and add them to your workspace. Systems already added are marked." }), result && (_jsxs("div", { className: "mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3", children: [_jsxs("p", { className: "text-xs text-primary-400", children: ["Added ", result.created, " system", result.created !== 1 ? 's' : '', result.skipped > 0 && ` (${result.skipped} already existed)`] }), _jsx("button", { onClick: () => setResult(null), className: "mt-1 text-[10px] text-zinc-500 hover:text-zinc-300", children: "Dismiss" })] })), _jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx("div", { className: "relative flex-1 max-w-xs", children: _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search systems..." }) }), _jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All categories" }), categories.map((cat) => (_jsx("option", { value: cat, children: CATEGORY_LABELS[cat]?.label ?? cat }, cat)))] }), selectedIds.size > 0 && (_jsx("button", { onClick: handleAdd, disabled: addFromLibrary.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: addFromLibrary.isPending ? 'Adding...' : `Add ${selectedIds.size} selected` }))] }), (categoryFilter ? [categoryFilter] : categories).map((cat) => {
                    const items = filtered.filter((s) => s.category === cat);
                    if (items.length === 0)
                        return null;
                    const catInfo = CATEGORY_LABELS[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' };
                    return (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [_jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${catInfo.color}`, children: catInfo.label }), _jsxs("span", { className: "text-xs text-zinc-600", children: [items.length, " tools"] })] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: items.map((system) => {
                                    const alreadyAdded = existingNames.has(system.name.toLowerCase());
                                    const isSelected = selectedIds.has(system.id);
                                    return (_jsxs("button", { onClick: () => !alreadyAdded && toggleSelect(system.id), disabled: alreadyAdded, className: `rounded-lg border p-3 text-left transition-all ${alreadyAdded
                                            ? 'border-zinc-800 bg-zinc-800/30 opacity-50 cursor-not-allowed'
                                            : isSelected
                                                ? 'border-primary-400/50 bg-primary-400/5'
                                                : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium text-zinc-100 truncate", children: system.name }), _jsx("p", { className: "text-[11px] text-zinc-500", children: system.vendor })] }), alreadyAdded ? (_jsx("span", { className: "shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400", children: "Added" })) : isSelected ? (_jsx("span", { className: "shrink-0 rounded bg-primary-400/20 px-1.5 py-0.5 text-[10px] text-primary-400", children: "Selected" })) : null] }), system.description && (_jsx("p", { className: "mt-1 text-[11px] text-zinc-500 line-clamp-1", children: system.description })), _jsxs("div", { className: "mt-1.5 flex items-center gap-2", children: [_jsx("span", { className: "text-[10px] text-zinc-600", children: system.default_classification }), _jsx("span", { className: "text-[10px] text-zinc-700", children: "\u00B7" }), _jsxs("span", { className: "text-[10px] text-zinc-600", children: [system.default_sensitivity, " sensitivity"] })] })] }, system.id));
                                }) })] }, cat));
                })] }) }));
}
// ── Baselines Library Tab Component ──────────────────────────────────────────
function BaselinesLibraryTab({ workspaceId }) {
    const { library, isLoading: libLoading } = useBaselineLibrary(workspaceId);
    const { baselines: existingBaselines } = useBaselines(workspaceId);
    const addFromLibrary = useAddFromBaselineLibrary(workspaceId);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');
    const [result, setResult] = useState(null);
    const existingNames = new Set((existingBaselines ?? []).map((b) => b.name?.toLowerCase()));
    const categories = Array.from(new Set(library.map((b) => b.category)));
    const BASELINE_CATS = {
        identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
        data_protection: { label: 'Data Protection', color: 'bg-green-500/10 text-green-400' },
        network: { label: 'Network', color: 'bg-cyan-500/10 text-cyan-400' },
        endpoint: { label: 'Endpoint', color: 'bg-purple-500/10 text-purple-400' },
        logging: { label: 'Logging', color: 'bg-amber-500/10 text-amber-400' },
        application: { label: 'Application', color: 'bg-orange-500/10 text-orange-400' },
        continuity: { label: 'Continuity', color: 'bg-red-500/10 text-red-400' },
        governance: { label: 'Governance', color: 'bg-indigo-500/10 text-indigo-400' },
    };
    const filtered = library.filter((b) => {
        if (categoryFilter && b.category !== categoryFilter)
            return false;
        if (search) {
            const q = search.toLowerCase();
            return b.name.toLowerCase().includes(q) || (b.description ?? '').toLowerCase().includes(q);
        }
        return true;
    });
    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id))
            next.delete(id);
        else
            next.add(id);
        setSelectedIds(next);
    };
    const handleAdd = () => {
        if (selectedIds.size === 0)
            return;
        addFromLibrary.mutate({ libraryIds: Array.from(selectedIds) }, {
            onSuccess: (data) => {
                setResult({ created: data.created, skipped: data.skipped });
                setSelectedIds(new Set());
            },
        });
    };
    if (libLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsx("div", { className: "space-y-5", children: _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-100", children: "Baselines Library" }), _jsx("p", { className: "mt-0.5 mb-4 text-xs text-zinc-500", children: "Browse compliance baselines and activate them in your workspace. Already active baselines are marked." }), result && (_jsxs("div", { className: "mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3", children: [_jsxs("p", { className: "text-xs text-primary-400", children: ["Activated ", result.created, " baseline", result.created !== 1 ? 's' : '', result.skipped > 0 && ` (${result.skipped} already existed)`] }), _jsx("button", { onClick: () => setResult(null), className: "mt-1 text-[10px] text-zinc-500 hover:text-zinc-300", children: "Dismiss" })] })), _jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx("div", { className: "relative flex-1 max-w-xs", children: _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search baselines..." }) }), _jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All categories" }), categories.map((cat) => (_jsx("option", { value: cat, children: BASELINE_CATS[cat]?.label ?? cat }, cat)))] }), selectedIds.size > 0 && (_jsx("button", { onClick: handleAdd, disabled: addFromLibrary.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: addFromLibrary.isPending ? 'Activating...' : `Activate ${selectedIds.size} selected` }))] }), (categoryFilter ? [categoryFilter] : categories).map((cat) => {
                    const items = filtered.filter((b) => b.category === cat);
                    if (items.length === 0)
                        return null;
                    const catInfo = BASELINE_CATS[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' };
                    return (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [_jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${catInfo.color}`, children: catInfo.label }), _jsxs("span", { className: "text-xs text-zinc-600", children: [items.length, " baselines"] })] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: items.map((bl) => {
                                    const alreadyAdded = existingNames.has(bl.name?.toLowerCase());
                                    const isSelected = selectedIds.has(bl.id);
                                    const sevColor = bl.severity === 'critical' ? 'text-red-400' : bl.severity === 'high' ? 'text-orange-400' : bl.severity === 'medium' ? 'text-amber-400' : 'text-zinc-400';
                                    return (_jsxs("button", { onClick: () => !alreadyAdded && toggleSelect(bl.id), disabled: alreadyAdded, className: `rounded-lg border p-3 text-left transition-all ${alreadyAdded ? 'border-zinc-800 bg-zinc-800/30 opacity-50 cursor-not-allowed'
                                            : isSelected ? 'border-primary-400/50 bg-primary-400/5'
                                                : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: "text-sm font-medium text-zinc-100", children: bl.name }), alreadyAdded ? (_jsx("span", { className: "shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400", children: "Active" })) : isSelected ? (_jsx("span", { className: "shrink-0 rounded bg-primary-400/20 px-1.5 py-0.5 text-[10px] text-primary-400", children: "Selected" })) : null] }), bl.description && _jsx("p", { className: "mt-1 text-[11px] text-zinc-500 line-clamp-2", children: bl.description }), _jsxs("div", { className: "mt-1.5 flex items-center gap-2", children: [_jsx("span", { className: `text-[10px] font-medium ${sevColor}`, children: bl.severity }), _jsx("span", { className: "text-[10px] text-zinc-700", children: "\u00B7" }), _jsx("span", { className: "text-[10px] text-zinc-600", children: bl.check_type })] })] }, bl.id));
                                }) })] }, cat));
                })] }) }));
}
// ── Roles Library Tab Component ──────────────────────────────────────────────
function RolesLibraryTab({ workspaceId }) {
    const { library, isLoading } = useEmployeeLibrary(workspaceId);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const ROLE_CATS = {
        executive: { label: 'Executive', color: 'bg-amber-500/10 text-amber-400' },
        engineering: { label: 'Engineering', color: 'bg-blue-500/10 text-blue-400' },
        security: { label: 'Security & Compliance', color: 'bg-red-500/10 text-red-400' },
        it_ops: { label: 'IT & Operations', color: 'bg-purple-500/10 text-purple-400' },
        product: { label: 'Product & Design', color: 'bg-cyan-500/10 text-cyan-400' },
        sales_marketing: { label: 'Sales & Marketing', color: 'bg-orange-500/10 text-orange-400' },
        hr_people: { label: 'HR & People', color: 'bg-pink-500/10 text-pink-400' },
        finance_legal: { label: 'Finance & Legal', color: 'bg-indigo-500/10 text-indigo-400' },
    };
    const categories = Array.from(new Set(library.map((r) => r.category)));
    const filtered = library.filter((r) => {
        if (categoryFilter && r.category !== categoryFilter)
            return false;
        if (search) {
            const q = search.toLowerCase();
            return r.department?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
        }
        return true;
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsx("div", { className: "space-y-5", children: _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-100", children: "Departments & Roles" }), _jsx("p", { className: "mt-0.5 mb-4 text-xs text-zinc-500", children: "These departments and roles are used as suggestions when adding people to your directory. They are maintained by the platform." }), _jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx("div", { className: "relative flex-1 max-w-xs", children: _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search departments or roles..." }) }), _jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All categories" }), categories.map((cat) => (_jsx("option", { value: cat, children: ROLE_CATS[cat]?.label ?? cat }, cat)))] })] }), (categoryFilter ? [categoryFilter] : categories).map((cat) => {
                    const items = filtered.filter((r) => r.category === cat);
                    if (items.length === 0)
                        return null;
                    const catInfo = ROLE_CATS[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' };
                    return (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [_jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${catInfo.color}`, children: catInfo.label }), _jsxs("span", { className: "text-xs text-zinc-600", children: [items.length, " roles"] })] }), _jsx("div", { className: "overflow-x-auto rounded-lg border border-zinc-800", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-4 py-2 font-medium", children: "Department" }), _jsx("th", { className: "px-4 py-2 font-medium", children: "Title" }), _jsx("th", { className: "px-4 py-2 font-medium", children: "Description" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: items.map((role) => (_jsxs("tr", { className: "hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-4 py-2 font-medium text-zinc-200", children: role.department }), _jsx("td", { className: "px-4 py-2 text-zinc-300", children: role.title }), _jsx("td", { className: "px-4 py-2 text-xs text-zinc-500", children: role.description ?? '\u2014' })] }, role.id))) })] }) })] }, cat));
                })] }) }));
}
//# sourceMappingURL=settings.js.map