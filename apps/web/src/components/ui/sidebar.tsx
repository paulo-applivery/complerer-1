import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PanelLeftIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

// ── Hooks ─────────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

// ── Context ──────────────────────────────────────────────────────────────────

type SidebarState = 'expanded' | 'collapsed'

interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within SidebarProvider')
  return context
}

// ── Provider ─────────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_COLLAPSED = '3rem'
const SIDEBAR_COOKIE_KEY = 'sidebar:state'

interface SidebarProviderProps {
  defaultOpen?: boolean
  children: ReactNode
}

export function SidebarProvider({ defaultOpen = true, children }: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)

  const [open, setOpenState] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COOKIE_KEY)
    return stored ? stored === 'true' : defaultOpen
  })

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value)
    localStorage.setItem(SIDEBAR_COOKIE_KEY, String(value))
  }, [])

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setOpenMobile(prev => !prev)
    } else {
      setOpen(!open)
    }
  }, [open, setOpen])

  // Keyboard shortcut: Cmd+B / Ctrl+B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar])

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    if (!isMobile) setOpenMobile(false)
  }, [isMobile])

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: open ? 'expanded' : 'collapsed',
      open,
      setOpen,
      toggleSidebar,
      isMobile,
      openMobile,
      setOpenMobile,
    }),
    [open, setOpen, toggleSidebar, isMobile, openMobile]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        className="group/sidebar-wrapper flex min-h-svh w-full"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-collapsed': SIDEBAR_WIDTH_COLLAPSED,
          } as React.CSSProperties
        }
        data-sidebar-state={value.state}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps extends ComponentProps<'div'> {
  children: ReactNode
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar()

  return (
    <>
      {/* ── Mobile sidebar (sheet) ── */}
      <div className="md:hidden">
        {/* Backdrop */}
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpenMobile(false)}
          />
        )}
        {/* Sheet */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-svh w-[280px] flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-300 ease-in-out',
            openMobile ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          {...props}
        >
          {/* Close button */}
          <button
            onClick={() => setOpenMobile(false)}
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
          {children}
        </div>
      </div>

      {/* ── Desktop sidebar (fixed) ── */}
      <div
        className="group peer hidden md:block"
        data-state={state}
        data-collapsible={state === 'collapsed' ? 'icon' : ''}
      >
        {/* This div reserves space in the layout */}
        <div
          className={cn(
            'relative h-svh w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=icon]:w-(--sidebar-width-collapsed)'
          )}
        />
        {/* Actual sidebar, positioned fixed */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-10 flex h-svh w-(--sidebar-width) flex-col border-r border-zinc-800 bg-zinc-900 transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=icon]:w-(--sidebar-width-collapsed)',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    </>
  )
}

// ── SidebarInset (main content wrapper) ──────────────────────────────────────

export function SidebarInset({ className, children, ...props }: ComponentProps<'main'>) {
  return (
    <main
      className={cn(
        'relative flex min-h-svh min-w-0 flex-1 flex-col bg-zinc-950 overflow-x-hidden',
        'peer-data-[state=collapsed]:ml-0',
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
}

// ── SidebarHeader ────────────────────────────────────────────────────────────

export function SidebarHeader({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 p-2', className)} {...props}>
      {children}
    </div>
  )
}

// ── SidebarFooter ────────────────────────────────────────────────────────────

export function SidebarFooter({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 p-2', className)} {...props}>
      {children}
    </div>
  )
}

// ── SidebarContent (scrollable area) ─────────────────────────────────────────

export function SidebarContent({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ── SidebarGroup ─────────────────────────────────────────────────────────────

export function SidebarGroup({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('relative flex w-full min-w-0 flex-col p-2', className)} {...props}>
      {children}
    </div>
  )
}

// ── SidebarGroupLabel ────────────────────────────────────────────────────────

export function SidebarGroupLabel({ className, children, ...props }: ComponentProps<'div'>) {
  const { state } = useSidebar()
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-zinc-500 transition-[margin,opacity] duration-200 ease-linear',
        state === 'collapsed' && 'md:opacity-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ── SidebarMenu ──────────────────────────────────────────────────────────────

export function SidebarMenu({ className, children, ...props }: ComponentProps<'ul'>) {
  return (
    <ul className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props}>
      {children}
    </ul>
  )
}

// ── SidebarMenuItem ──────────────────────────────────────────────────────────

export function SidebarMenuItem({ className, children, ...props }: ComponentProps<'li'>) {
  return (
    <li className={cn('group/menu-item relative', className)} {...props}>
      {children}
    </li>
  )
}

// ── SidebarMenuButton ────────────────────────────────────────────────────────

interface SidebarMenuButtonProps extends ComponentProps<'button'> {
  isActive?: boolean
  tooltip?: string
}

export function SidebarMenuButton({
  className,
  children,
  isActive = false,
  ...props
}: SidebarMenuButtonProps) {
  const { state } = useSidebar()

  return (
    <button
      data-active={isActive}
      className={cn(
        'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors',
        'hover:bg-zinc-800 hover:text-zinc-100',
        'data-[active=true]:bg-primary-400/10 data-[active=true]:text-primary-400 data-[active=true]:font-medium',
        !isActive && 'text-zinc-400',
        state === 'collapsed' && 'md:justify-center md:px-0 md:[&>span]:hidden',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── SidebarMenuSub (collapsible submenu) ─────────────────────────────────────

export function SidebarMenuSub({ className, children, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'ml-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-zinc-800 px-2.5 py-0.5',
        className
      )}
      {...props}
    >
      {children}
    </ul>
  )
}

// ── SidebarMenuSubButton ─────────────────────────────────────────────────────

interface SidebarMenuSubButtonProps extends ComponentProps<'a'> {
  isActive?: boolean
}

export function SidebarMenuSubButton({
  className,
  children,
  isActive = false,
  ...props
}: SidebarMenuSubButtonProps) {
  return (
    <a
      data-active={isActive}
      className={cn(
        'flex min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 py-1 text-sm text-zinc-400 outline-none transition-colors',
        'hover:bg-zinc-800 hover:text-zinc-100',
        'data-[active=true]:text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

// ── SidebarTrigger ───────────────────────────────────────────────────────────

export function SidebarTrigger({ className, ...props }: ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={PanelLeftIcon} size={16} />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

// ── SidebarSeparator ─────────────────────────────────────────────────────────

export function SidebarSeparator({ className, ...props }: ComponentProps<'hr'>) {
  return <hr className={cn('mx-2 border-zinc-800', className)} {...props} />
}
