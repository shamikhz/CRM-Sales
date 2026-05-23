// Collection names — must match Admin CRM exactly
export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  TASKS: 'tasks',
  ATTENDANCE: 'attendance',
  VISITS: 'visits',
  NOTIFICATIONS: 'notifications',
  LIVE_LOCATIONS: 'liveLocations',
} as const;

// Navigation items for the bottom nav
export const SE_NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/dashboard', icon: 'Home' },
  { id: 'customers', label: 'Customers', href: '/dashboard/customers', icon: 'Users' },
  { id: 'orders', label: 'Orders', href: '/dashboard/orders', icon: 'ShoppingBag' },
  { id: 'tasks', label: 'Tasks', href: '/dashboard/tasks', icon: 'CheckSquare' },
  { id: 'profile', label: 'Profile', href: '/dashboard/profile', icon: 'User' },
] as const;

// Status color mappings
export const PRIORITY_COLORS = {
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
} as const;

export const TASK_STATUS_COLORS = {
  pending: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
  'in-progress': { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  overdue: { bg: 'bg-red-500/15', text: 'text-red-400' },
} as const;

export const PAYMENT_STATUS_COLORS = {
  paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  pending: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  partial: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  overdue: { bg: 'bg-red-500/15', text: 'text-red-400' },
} as const;

export const DELIVERY_STATUS_COLORS = {
  pending: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
  dispatched: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  delivered: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  cancelled: { bg: 'bg-red-500/15', text: 'text-red-400' },
} as const;
