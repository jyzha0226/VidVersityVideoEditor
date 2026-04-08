import React from 'react'
import VideoLibraryPage from '../components/library/VideoLibraryPage'

const draftVideos = [
  {
    id: 'draft-1',
    title: 'Campus interview rough cut',
    duration: '03:36',
    updatedAt: '12 minutes ago',
    notes: 'Trimmed intro, generated subtitles, and marked silence sections for review.',
    tag: 'Draft',
  },
  {
    id: 'draft-2',
    title: 'Lab walkthrough assembly',
    duration: '07:14',
    updatedAt: 'Today at 11:40',
    notes: 'Scene detections were reviewed and the timeline is ready for a second edit pass.',
    tag: 'Draft',
  },
  {
    id: 'draft-3',
    title: 'Lecture highlights v2',
    duration: '12:08',
    updatedAt: 'Yesterday at 18:05',
    notes: 'Subtitle text has been cleaned up, but transitions still need another pass.',
    tag: 'Draft',
  },
  {
    id: 'draft-4',
    title: 'Research explainer social cut',
    duration: '00:58',
    updatedAt: 'Yesterday at 09:22',
    notes: 'Short-form draft prepared for vertical export and thumbnail selection.',
    tag: 'Draft',
  },
]

export default function DraftsPage(): JSX.Element {
  return (
    <VideoLibraryPage
      activeTab="drafts"
      title="Saved drafts"
      subtitle="Browse in-progress video edits, resume unfinished cuts, and pick up where you left off once draft saving is connected."
      videos={draftVideos}
      primaryActionLabel="Upload Video"
    />
  )
}
