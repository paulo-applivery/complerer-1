import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Delete01Icon, } from '@hugeicons/core-free-icons';
import { useAdminProviders, useAdminProvider, useUpdateProvider, useUpdateProviderConfig, useDeleteProviderConfig, } from '@/hooks/use-admin';
const tabs = [
    { label: 'AI', value: 'ai' },
    { label: 'Email', value: 'email' },
    { label: 'Integration', value: 'integration' },
];
function ConfigEditor({ providerId }) {
    const { data } = useAdminProvider(providerId);
    const updateConfig = useUpdateProviderConfig();
    const deleteConfig = useDeleteProviderConfig();
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newIsSecret, setNewIsSecret] = useState(false);
    const configs = data?.configs ?? [];
    const handleAddConfig = () => {
        if (!newKey.trim())
            return;
        updateConfig.mutate({
            providerId,
            key: newKey.trim(),
            value: newValue,
            isSecret: newIsSecret,
        });
        setNewKey('');
        setNewValue('');
        setNewIsSecret(false);
    };
    return (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Configuration" }), configs.map((cfg) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-32 shrink-0 text-xs font-medium text-zinc-400", children: cfg.key }), _jsx("input", { type: cfg.isSecret ? 'password' : 'text', defaultValue: cfg.value, onBlur: (e) => {
                            if (e.target.value !== cfg.value) {
                                updateConfig.mutate({
                                    providerId,
                                    key: cfg.key,
                                    value: e.target.value,
                                    isSecret: cfg.isSecret,
                                });
                            }
                        }, className: "flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700" }), _jsx("button", { onClick: () => deleteConfig.mutate({ providerId, key: cfg.key }), className: "rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400", children: _jsx(HugeiconsIcon, { icon: Delete01Icon, size: 14 }) })] }, cfg.key))), _jsxs("div", { className: "flex items-center gap-2 border-t border-zinc-800/50 pt-3", children: [_jsx("input", { type: "text", placeholder: "Key", value: newKey, onChange: (e) => setNewKey(e.target.value), className: "w-32 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700" }), _jsx("input", { type: "text", placeholder: "Value", value: newValue, onChange: (e) => setNewValue(e.target.value), className: "flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700" }), _jsxs("label", { className: "flex items-center gap-1 text-xs text-zinc-500", children: [_jsx("input", { type: "checkbox", checked: newIsSecret, onChange: (e) => setNewIsSecret(e.target.checked), className: "rounded" }), "Secret"] }), _jsx("button", { onClick: handleAddConfig, disabled: !newKey.trim(), className: "rounded-xl bg-primary-400/10 px-3 py-1.5 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-400/20 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: Add01Icon, size: 14 }) })] })] }));
}
function ProviderCard({ provider }) {
    const updateProvider = useUpdateProvider();
    const [expanded, setExpanded] = useState(false);
    return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-medium text-zinc-100", children: provider.name }), _jsx("span", { className: "rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500", children: provider.slug })] }), provider.description && (_jsx("p", { className: "mt-1 text-sm text-zinc-500", children: provider.description }))] }), _jsx("button", { onClick: () => {
                            updateProvider.mutate({ id: provider.id, enabled: !provider.enabled });
                        }, className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${provider.enabled ? 'bg-primary-400' : 'bg-zinc-700'}`, children: _jsx("span", { className: `pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${provider.enabled ? 'translate-x-5' : 'translate-x-0'}` }) })] }), _jsx("button", { onClick: () => setExpanded(!expanded), className: "mt-3 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300", children: expanded ? 'Hide config' : 'Show config' }), expanded && _jsx(ConfigEditor, { providerId: provider.id })] }));
}
export function AdminProvidersPage() {
    const [activeTab, setActiveTab] = useState('ai');
    const { data, isLoading } = useAdminProviders(activeTab);
    const providers = data?.providers ?? [];
    return (_jsxs("div", { className: "mx-auto w-full max-w-5xl space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Providers" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Manage AI models, email services, and integration providers." })] }), _jsx("div", { className: "flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1", children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.value), className: `flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.value
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'}`, children: tab.label }, tab.value))) }), isLoading ? (_jsx("div", { className: "flex h-40 items-center justify-center", children: _jsx("p", { className: "text-sm text-zinc-500", children: "Loading providers..." }) })) : (_jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [providers.map((provider) => (_jsx(ProviderCard, { provider: provider }, provider.id))), providers.length === 0 && (_jsx("p", { className: "col-span-full py-8 text-center text-sm text-zinc-500", children: "No providers in this category." }))] }))] }));
}
//# sourceMappingURL=providers.js.map