import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getStatusColor(status: string) {
  const statusColors: Record<string, string> = {
    'NEW': 'bg-blue-100 text-blue-800',
    'CONTACTED': 'bg-yellow-100 text-yellow-800',
    'QUALIFIED': 'bg-green-100 text-green-800',
    'PROPOSAL': 'bg-purple-100 text-purple-800',
    'NEGOTIATION': 'bg-orange-100 text-orange-800',
    'CLOSED_WON': 'bg-green-100 text-green-800',
    'CLOSED_LOST': 'bg-red-100 text-red-800',
    'ACTIVE': 'bg-green-100 text-green-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
    'PROSPECT': 'bg-blue-100 text-blue-800',
    'APPLIED': 'bg-blue-100 text-blue-800',
    'SCREENING': 'bg-yellow-100 text-yellow-800',
    'ASSESSMENT': 'bg-purple-100 text-purple-800',
    'INTERVIEW': 'bg-orange-100 text-orange-800',
    'OFFER': 'bg-green-100 text-green-800',
    'HIRED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function getRoleDisplayName(role: string) {
  const roleNames: Record<string, string> = {
    'EMPLOYER': 'Employer',
    'HR_MANAGER': 'HR Manager',
    'HIRING_MANAGER': 'Hiring Manager',
    'BUSINESS_DEV': 'Business Development',
    'CANDIDATE': 'Candidate',
  }
  return roleNames[role] || role
}
