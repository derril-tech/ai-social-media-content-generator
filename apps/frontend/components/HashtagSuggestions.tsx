'use client'

import { useState } from 'react'

interface Hashtag {
  tag: string
  rank: number
  popularity: number
  relevance: number
  isSelected: boolean
}

interface HashtagSuggestionsProps {
  topic: string
  onHashtagsChange: (hashtags: string[]) => void
}

export default function HashtagSuggestions({ topic, onHashtagsChange }: HashtagSuggestionsProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([
    { tag: '#AI', rank: 1, popularity: 0.95, relevance: 0.92, isSelected: false },
    { tag: '#SocialMedia', rank: 2, popularity: 0.88, relevance: 0.85, isSelected: false },
    { tag: '#Innovation', rank: 3, popularity: 0.82, relevance: 0.78, isSelected: false },
    { tag: '#Tech', rank: 4, popularity: 0.79, relevance: 0.75, isSelected: false },
    { tag: '#Marketing', rank: 5, popularity: 0.76, relevance: 0.72, isSelected: false },
    { tag: '#ContentCreation', rank: 6, popularity: 0.73, relevance: 0.88, isSelected: false },
    { tag: '#DigitalMarketing', rank: 7, popularity: 0.70, relevance: 0.80, isSelected: false },
    { tag: '#Automation', rank: 8, popularity: 0.67, relevance: 0.85, isSelected: false },
  ])

  const [selectedCount, setSelectedCount] = useState(0)
  const maxHashtags = 30

  const handleHashtagToggle = (tag: string) => {
    const updatedHashtags = hashtags.map(h => 
      h.tag === tag ? { ...h, isSelected: !h.isSelected } : h
    )
    
    const newSelectedCount = updatedHashtags.filter(h => h.isSelected).length
    
    if (newSelectedCount <= maxHashtags) {
      setHashtags(updatedHashtags)
      setSelectedCount(newSelectedCount)
      
      const selectedTags = updatedHashtags
        .filter(h => h.isSelected)
        .map(h => h.tag)
      
      onHashtagsChange(selectedTags)
    }
  }

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'text-green-600'
    if (rank <= 6) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 0.8) return 'text-green-600'
    if (popularity >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-green-600'
    if (relevance >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const sortedHashtags = [...hashtags].sort((a, b) => a.rank - b.rank)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Hashtag Suggestions</h3>
        <div className="text-sm text-gray-600">
          {selectedCount}/{maxHashtags} selected
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Topic: {topic}
        </label>
        <div className="text-sm text-gray-600">
          Ranked by popularity and relevance to your content
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedHashtags.map((hashtag) => (
          <div
            key={hashtag.tag}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
              hashtag.isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleHashtagToggle(hashtag.tag)}
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={hashtag.isSelected}
                onChange={() => handleHashtagToggle(hashtag.tag)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="font-medium text-gray-900">{hashtag.tag}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className={`font-medium ${getRankColor(hashtag.rank)}`}>
                Rank #{hashtag.rank}
              </div>
              <div className={`${getPopularityColor(hashtag.popularity)}`}>
                {(hashtag.popularity * 100).toFixed(0)}% popular
              </div>
              <div className={`${getRelevanceColor(hashtag.relevance)}`}>
                {(hashtag.relevance * 100).toFixed(0)}% relevant
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Hashtags:</h4>
          <div className="flex flex-wrap gap-2">
            {hashtags
              .filter(h => h.isSelected)
              .map(h => (
                <span
                  key={h.tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {h.tag}
                  <button
                    onClick={() => handleHashtagToggle(h.tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        </div>
      )}

      {selectedCount >= maxHashtags && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span className="text-sm text-yellow-800">
              Maximum hashtags reached. Consider removing some to add others.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
