import React from 'react'
import { EyeIcon, ShieldCheckIcon, CpuChipIcon } from '@heroicons/react/24/outline'

export default function OraclePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Oracle System</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Event verification system for conditional donations
          </p>
        </div>

        {/* Status */}
        <div className="card p-8 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CpuChipIcon className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Development Phase</h2>
            <p className="text-gray-600">
              The Oracle system is under development. This will enable automated verification 
              of real-world events to trigger conditional donations.
            </p>
          </div>
        </div>

        {/* Planned Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Natural disaster monitoring</li>
              <li>• Sports event outcomes</li>
              <li>• Legislative tracking</li>
              <li>• Economic milestones</li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Multi-source verification</li>
              <li>• Cryptographic proofs</li>
              <li>• Consensus validation</li>
              <li>• Audit trail</li>
            </ul>
          </div>
        </div>

        {/* Architecture */}
        <div className="card p-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">System Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
              <p className="text-sm text-gray-600">Multiple trusted feeds</p>
            </div>
            
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">Validation</h4>
              <p className="text-sm text-gray-600">Consensus verification</p>
            </div>
            
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">Integration</h4>
              <p className="text-sm text-gray-600">Smart contract connection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
