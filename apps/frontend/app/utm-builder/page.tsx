'use client'

import { useState } from 'react'
import UTMBuilder from '@/components/UTMBuilder'
import Layout from '@/components/Layout'

export default function UTMBuilderPage() {
  const [baseUrl, setBaseUrl] = useState('https://example.com')
  const [generatedUrl, setGeneratedUrl] = useState('https://example.com')

  const handleUrlChange = (url: string) => {
    setGeneratedUrl(url)
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">UTM Builder</h1>
        <p className="text-gray-600 mt-2">
          Create tracking URLs with UTM parameters for your marketing campaigns
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UTMBuilder
          baseUrl={baseUrl}
          onUrlChange={handleUrlChange}
        />

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">URL Preview</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated URL
                </label>
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-md break-all text-sm">
                  {generatedUrl}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Length
                </label>
                <div className="text-sm text-gray-600">
                  {generatedUrl.length} characters
                  {generatedUrl.length > 2048 && (
                    <span className="text-red-600 ml-2">⚠️ URL is very long</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent URLs</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>No recent URLs yet.</p>
              <p>Generated URLs will appear here for quick access.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Use consistent naming conventions for campaigns</li>
              <li>• Keep UTM parameters short and descriptive</li>
              <li>• Test your URLs before using them in campaigns</li>
              <li>• Use lowercase for parameter values</li>
              <li>• Avoid special characters in UTM parameters</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
