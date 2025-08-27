'use client'

import { useState } from 'react'
import HashtagSuggestions from '@/components/HashtagSuggestions'
import Layout from '@/components/Layout'

export default function HashtagsPage() {
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([])
  const [topic, setTopic] = useState('AI Social Media Tools')

  const handleHashtagsChange = (hashtags: string[]) => {
    setSelectedHashtags(hashtags)
    console.log('Selected hashtags:', hashtags)
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hashtag Suggestions</h1>
        <p className="text-gray-600 mt-2">
          Discover and select relevant hashtags for your content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your content topic..."
            />
          </div>

          <HashtagSuggestions
            topic={topic}
            onHashtagsChange={handleHashtagsChange}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Hashtags</h3>
            
            {selectedHashtags.length > 0 ? (
              <div className="space-y-2">
                {selectedHashtags.map((hashtag, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{hashtag}</span>
                    <button
                      onClick={() => {
                        const filtered = selectedHashtags.filter((_, i) => i !== index)
                        setSelectedHashtags(filtered)
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Copy to Clipboard:</h4>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-white border rounded text-sm">
                      {selectedHashtags.join(' ')}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedHashtags.join(' '))}
                      className="btn-primary text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No hashtags selected yet.</p>
                <p className="text-sm mt-1">Select hashtags from the suggestions to see them here.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hashtag Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Use 3-5 hashtags for optimal engagement</li>
              <li>• Mix popular and niche hashtags</li>
              <li>• Avoid overused or banned hashtags</li>
              <li>• Research hashtag performance regularly</li>
              <li>• Create branded hashtags for your campaigns</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
