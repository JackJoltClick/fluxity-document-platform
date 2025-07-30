'use client'

import Link from 'next/link'

const settingsOptions = [
  {
    name: 'GL Accounts',
    href: '/settings/gl-accounts',
    description: 'Manage your general ledger accounts and keywords for automatic matching',
    icon: '📊',
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    name: 'GL Assignment Rules',
    href: '/settings/gl-rules',
    description: 'Create automated rules to assign GL codes based on vendor, description, and amount patterns',
    icon: '🔄',
    color: 'bg-green-50 text-green-600 border-green-200'
  }
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and system configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsOptions.map((option) => (
          <Link
            key={option.name}
            href={option.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${option.color}`}>
                <span className="text-2xl">{option.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {option.description}
                </p>
                <div className="mt-3">
                  <span className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    Configure →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">📊</div>
            <div className="text-sm text-gray-600 mt-1">GL Accounts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">🔄</div>
            <div className="text-sm text-gray-600 mt-1">Assignment Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">⚡</div>
            <div className="text-sm text-gray-600 mt-1">Automation</div>
          </div>
        </div>
      </div>
    </div>
  )
}