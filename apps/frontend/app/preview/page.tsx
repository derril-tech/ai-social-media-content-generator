'use client'

import { useState } from 'react'
import PlatformPreview from '@/components/PlatformPreview'
import Layout from '@/components/Layout'

const platforms = [
  'twitter',
  'linkedin', 
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'pinterest'
]

export default function PreviewPage() {
  const [content, setContent] = useState('🚀 Exciting news! Our new AI-powered social media tool is here to revolutionize your content strategy. #AI #SocialMedia #Innovation')
  const [selectedPlatform, setSelectedPlatform] = useState('twitter')

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Platform Previews</h1>
        <p className="text-gray-600 mt-2">
          See how your content will look across different platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platform
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <PlatformPreview
            content={content}
            platform={selectedPlatform}
            onContentChange={setContent}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">All Platform Previews</h3>
          <div className="space-y-6">
            {platforms.map((platform) => (
              <div key={platform} className="border border-gray-200 rounded-lg p-4">
                <PlatformPreview
                  content={content}
                  platform={platform}
                  onContentChange={() => {}} // Read-only for preview
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
