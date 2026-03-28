/**
 * Claude tool definitions for compliance operations.
 * These define the tools Claude can call via tool_use.
 */
export const complianceTools = [
  {
    name: 'search_controls',
    description:
      'Search compliance framework controls by keyword or topic. Use this when the user asks about specific controls, requirements, or compliance topics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for controls' },
        framework: {
          type: 'string',
          description:
            'Optional framework slug filter (soc2, iso27001, nist_csf, cis_v8, pci_dss)',
        },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_compliance_posture',
    description:
      'Get the current compliance posture for the workspace including framework coverage, evidence stats, and access risk.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_access_records',
    description:
      'List access records with optional filters. Use when user asks about who has access to what.',
    input_schema: {
      type: 'object' as const,
      properties: {
        systemName: { type: 'string', description: 'Filter by system name' },
        userName: { type: 'string', description: 'Filter by person name' },
        status: {
          type: 'string',
          enum: ['active', 'revoked', 'all'],
          description: 'Filter by status (default: active)',
        },
      },
    },
  },
  {
    name: 'register_access',
    description:
      'Register a new access grant directly (non-interactive). Only use this if the user has explicitly provided ALL required fields (userName, userEmail, systemName, role). If any field is missing or the user asks to "register" or "add" access without providing all details, use show_access_form instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        userName: {
          type: 'string',
          description: 'Name of the person being granted access',
        },
        userEmail: { type: 'string', description: 'Email of the person' },
        systemName: { type: 'string', description: 'Name of the system' },
        role: {
          type: 'string',
          enum: ['admin', 'write', 'read'],
          description: 'Access role',
        },
        approvedBy: {
          type: 'string',
          description: 'Who approved the access',
        },
        ticketRef: {
          type: 'string',
          description: 'Ticket reference (e.g. JIRA-123)',
        },
      },
      required: ['userName', 'userEmail', 'systemName', 'role'],
    },
  },
  {
    name: 'show_access_form',
    description:
      'Show an interactive access registration form to the user. Use this when the user wants to register, add, or grant access but has NOT provided all required details. Pre-fill any fields the user mentioned. This is the PREFERRED way to register access — always use this instead of register_access unless the user explicitly provided all 4 required fields.',
    input_schema: {
      type: 'object' as const,
      properties: {
        prefill: {
          type: 'object',
          description: 'Pre-fill form fields extracted from the conversation',
          properties: {
            userName: { type: 'string', description: 'Name of the person' },
            userEmail: { type: 'string', description: 'Email of the person' },
            systemName: { type: 'string', description: 'System name' },
            role: { type: 'string', enum: ['admin', 'write', 'read'], description: 'Access role' },
            approvedBy: { type: 'string', description: 'Approver name' },
            ticketRef: { type: 'string', description: 'Ticket reference' },
          },
        },
      },
    },
  },
  {
    name: 'check_evidence_gaps',
    description:
      'Check which controls are missing evidence. Use when user asks about compliance gaps or what evidence is needed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        framework: {
          type: 'string',
          description: 'Framework slug to check (soc2, iso27001, etc.)',
        },
      },
    },
  },
  {
    name: 'list_violations',
    description:
      'List current baseline violations. Use when user asks about compliance issues or what needs attention.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'resolved', 'exempted'],
          description: 'Filter by status (default: open)',
        },
      },
    },
  },
]
