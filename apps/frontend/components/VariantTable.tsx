'use client'

import { useState } from 'react'

interface Variant {
  id: string
  content: string
  platform: string
  scores: {
    brandFit: number
    readability: number
    policyRisk: number
    overall: number
  }
  riskLevel: 'low' | 'medium' | 'high'
}

interface VariantTableProps {
  variants: Variant[]
  onVariantUpdate: (id: string, updates: Partial<Variant>) => void
}

export default function VariantTable({ variants, onVariantUpdate }: VariantTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleEdit = (variant: Variant) => {
    setEditingId(variant.id)
    setEditContent(variant.content)
  }

  const handleSave = (id: string) => {
    onVariantUpdate(id, { content: editContent })
    setEditingId(null)
    setEditContent('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditContent('')
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Content Variants</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand Fit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Readability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policy Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overall
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {variant.platform}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {editingId === variant.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(variant.id)}
                          className="text-sm bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-sm bg-gray-600 text-white px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-xs truncate">
                      {variant.content}
                      <button
                        onClick={() => handleEdit(variant)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getScoreColor(variant.scores.brandFit)}`}>
                  {(variant.scores.brandFit * 100).toFixed(0)}%
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getScoreColor(variant.scores.readability)}`}>
                  {(variant.scores.readability * 100).toFixed(0)}%
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getScoreColor(1 - variant.scores.policyRisk)}`}>
                  {((1 - variant.scores.policyRisk) * 100).toFixed(0)}%
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getScoreColor(variant.scores.overall)}`}>
                  {(variant.scores.overall * 100).toFixed(0)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(variant.riskLevel)}`}>
                    {variant.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-800 mr-2">
                    Preview
                  </button>
                  <button className="text-green-600 hover:text-green-800">
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
