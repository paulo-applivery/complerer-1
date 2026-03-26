import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  CrownIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { useAdminMembers, usePromoteMember, useDemoteMember } from '@/hooks/use-admin'
import { useAuth } from '@/hooks/use-auth'

export function AdminMembersPage() {
  const { data, isLoading } = useAdminMembers()
  const promote = usePromoteMember()
  const demote = useDemoteMember()
  const { user } = useAuth()

  const members = data?.members ?? []
  const superAdmins = members.filter((m) => m.isSuperAdmin)
  const regularUsers = members.filter((m) => !m.isSuperAdmin)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Super Admin Members</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage who has super admin access to the platform.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      ) : (
        <>
          {/* Super Admins */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={CrownIcon} size={18} className="text-amber-400" />
              <h2 className="text-lg font-semibold text-zinc-100">Super Admins</h2>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                {superAdmins.length}
              </span>
            </div>

            <div className="space-y-2">
              {superAdmins.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-amber-400/5">
                      <span className="text-sm font-semibold text-amber-400">
                        {member.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-100">{member.name}</p>
                        {member.email === user?.email && (
                          <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                            you
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">
                      {member.lastLoginAt
                        ? `Last login: ${new Date(member.lastLoginAt).toLocaleDateString()}`
                        : 'Never logged in'}
                    </span>
                    {member.email !== user?.email && (
                      <button
                        onClick={() => demote.mutate(member.id)}
                        disabled={demote.isPending}
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                        Remove admin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Users */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-100">All Users</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                {regularUsers.length}
              </span>
            </div>

            {regularUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-800/20 py-8 text-center">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={24}
                  className="mx-auto mb-2 text-zinc-600"
                />
                <p className="text-sm text-zinc-500">All users are super admins</p>
              </div>
            ) : (
              <div className="space-y-2">
                {regularUsers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                        <span className="text-sm font-semibold text-zinc-400">
                          {member.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{member.name}</p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-600">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => promote.mutate(member.id)}
                        disabled={promote.isPending}
                        className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={Shield01Icon} size={12} />
                        Make admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
