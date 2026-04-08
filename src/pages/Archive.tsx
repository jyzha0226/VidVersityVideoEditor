import React from 'react'
import VideoLibraryPage from '../components/library/VideoLibraryPage'

const archivedVideos = [
  {
    id: 'archive-1',
    title: 'Semester promo final export',
    duration: '02:42',
    updatedAt: 'March 28, 2026',
    notes: 'Completed campaign cut moved out of the active workspace after final review.',
    tag: 'Archived',
  },
  {
    id: 'archive-2',
    title: 'Student testimonial master',
    duration: '05:03',
    updatedAt: 'March 14, 2026',
    notes: 'Long-form testimonial archived after social, web, and subtitle versions were delivered.',
    tag: 'Archived',
  },
  {
    id: 'archive-3',
    title: 'Open day teaser',
    duration: '01:21',
    updatedAt: 'February 25, 2026',
    notes: 'Previous teaser kept for reference while the new event campaign is being assembled.',
    tag: 'Archived',
  },
  {
    id: 'archive-4',
    title: 'Faculty panel recap',
    duration: '09:47',
    updatedAt: 'January 30, 2026',
    notes: 'Archived after delivery so the timeline stays focused on current semester content.',
    tag: 'Archived',
  },
]

export default function ArchivePage(): JSX.Element {
  return (
    <VideoLibraryPage
      activeTab="archive"
      title="Archived videos"
      subtitle="Keep older completed edits accessible without cluttering the active editor. This page can later connect to real archived project data."
      videos={archivedVideos}
      primaryActionLabel="Recover Video"
    />
  )
}
