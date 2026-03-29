import { type ComponentProps, type ReactNode } from 'react';
type SidebarState = 'expanded' | 'collapsed';
interface SidebarContextValue {
    state: SidebarState;
    open: boolean;
    setOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    isMobile: boolean;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
}
export declare function useSidebar(): SidebarContextValue;
interface SidebarProviderProps {
    defaultOpen?: boolean;
    children: ReactNode;
}
export declare function SidebarProvider({ defaultOpen, children }: SidebarProviderProps): import("react/jsx-runtime").JSX.Element;
interface SidebarProps extends ComponentProps<'div'> {
    children: ReactNode;
}
export declare function Sidebar({ className, children, ...props }: SidebarProps): import("react/jsx-runtime").JSX.Element;
export declare function SidebarInset({ className, children, ...props }: ComponentProps<'main'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarHeader({ className, children, ...props }: ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarFooter({ className, children, ...props }: ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarContent({ className, children, ...props }: ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarGroup({ className, children, ...props }: ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarGroupLabel({ className, children, ...props }: ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarMenu({ className, children, ...props }: ComponentProps<'ul'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarMenuItem({ className, children, ...props }: ComponentProps<'li'>): import("react/jsx-runtime").JSX.Element;
interface SidebarMenuButtonProps extends ComponentProps<'button'> {
    isActive?: boolean;
    tooltip?: string;
}
export declare function SidebarMenuButton({ className, children, isActive, ...props }: SidebarMenuButtonProps): import("react/jsx-runtime").JSX.Element;
export declare function SidebarMenuSub({ className, children, ...props }: ComponentProps<'ul'>): import("react/jsx-runtime").JSX.Element;
interface SidebarMenuSubButtonProps extends ComponentProps<'a'> {
    isActive?: boolean;
}
export declare function SidebarMenuSubButton({ className, children, isActive, ...props }: SidebarMenuSubButtonProps): import("react/jsx-runtime").JSX.Element;
export declare function SidebarTrigger({ className, ...props }: ComponentProps<'button'>): import("react/jsx-runtime").JSX.Element;
export declare function SidebarSeparator({ className, ...props }: ComponentProps<'hr'>): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=sidebar.d.ts.map