import Calendar from '@/components/Calendar'
import Layout from '@/components/Layout'

// Mock data - in real app this would come from API
const mockPosts = [
  {
    id: '1',
    title: 'Tech Update Post',
    platform: 'Twitter',
    scheduledFor: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Product Launch',
    platform: 'LinkedIn',
    scheduledFor: '2024-01-16T14:00:00Z',
  },
  {
    id: '3',
    title: 'Weekly Roundup',
    platform: 'Instagram',
    scheduledFor: '2024-01-17T18:00:00Z',
  },
]

export default function CalendarPage() {
  const handleScheduleChange = (postId: string, newDate: string) => {
    // TODO: Call API to update schedule
    console.log(`Post ${postId} rescheduled to ${newDate}`)
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
        <p className="text-gray-600 mt-2">
          Drag and drop posts to reschedule them
        </p>
      </div>
      
      <Calendar 
        posts={mockPosts} 
        onScheduleChange={handleScheduleChange}
      />
    </Layout>
  )
}
