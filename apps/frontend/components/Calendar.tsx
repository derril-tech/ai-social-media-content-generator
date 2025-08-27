'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

interface Post {
  id: string
  title: string
  platform: string
  scheduledFor: string
}

interface CalendarProps {
  posts: Post[]
  onScheduleChange: (postId: string, newDate: string) => void
}

export default function Calendar({ posts, onScheduleChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor)
      return postDate.toDateString() === date.toDateString()
    })
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const postId = result.draggableId
    const newDate = result.destination.droppableId
    onScheduleChange(postId, newDate)
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="btn-secondary"
          >
            Previous
          </button>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-gray-600">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => (
            <Droppable key={index} droppableId={day ? day.toISOString() : `empty-${index}`}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-24 p-2 border ${
                    day ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {day && (
                    <div className="text-sm font-medium mb-1">
                      {day.getDate()}
                    </div>
                  )}
                  
                  {day && getPostsForDate(day).map((post, postIndex) => (
                    <Draggable key={post.id} draggableId={post.id} index={postIndex}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-blue-100 text-blue-800 text-xs p-1 rounded mb-1 cursor-move"
                        >
                          {post.title}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
