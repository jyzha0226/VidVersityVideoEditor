import React, { useRef, useState } from 'react'
import {
  Bell,
  Clapperboard,
  Files,
  FolderArchive,
  HelpCircle,
  Moon,
  Settings,
  Sun,
  Upload,
  Video,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router'
import { useTheme } from '../../theme/ThemeProvider'

interface LibraryVideoItem {
  id: string
  title: string
  duration: string
  updatedAt: string
  notes: string
  tag: string
}

interface VideoLibraryPageProps {
  activeTab: 'drafts' | 'archive'
  title: string
  subtitle: string
  videos: LibraryVideoItem[]
  primaryActionLabel: string
}

export default function VideoLibraryPage({
  activeTab,
  title,
  subtitle,
  videos,
  primaryActionLabel,
}: VideoLibraryPageProps): JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [guidedMode, setGuidedMode] = useState(true)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
      isActive
        ? isDark
          ? 'bg-[#182238] text-[#8bb8ff] font-semibold shadow-sm'
          : 'bg-white text-[#003fb1] font-semibold shadow-sm'
        : isDark
          ? 'text-[#9fb0ca] hover:bg-[#182238] hover:text-[#8bb8ff]'
          : 'text-[#57657a] hover:bg-white hover:text-[#003fb1]'
    }`

  const handlePrimaryAction = () => {
    if (activeTab === 'drafts') {
      fileInputRef.current?.click()
      return
    }
    if (!selectedVideoId) return
    navigate('/')
  }

  const handleUploadVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const videoUrl = URL.createObjectURL(file)
    navigate('/', {
      state: {
        preloadedVideoUrl: videoUrl,
      },
    })
    event.target.value = ''
  }

  return (
    <div
      className={`h-screen overflow-hidden font-sans transition-colors ${
        isDark ? 'bg-[#0b1220] text-[#edf2ff]' : 'bg-[#f7f9fb] text-[#191c1e]'
      }`}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-[#de34ab] px-5 py-3 text-white shadow-[0_12px_40px_rgba(222,52,171,0.28)]">
        <div className="flex items-center gap-8">
          <div className="font-['Manrope'] text-xl font-extrabold tracking-[-0.04em]">
            Vidversity
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setGuidedMode((prev) => !prev)}
            className="flex items-center gap-3 rounded-full bg-white/18 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] backdrop-blur"
          >
            <span>Guided Mode</span>
            <span
              className={`relative h-5 w-10 rounded-full transition ${
                guidedMode ? 'bg-[#1a56db]' : 'bg-white/35'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                  guidedMode ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="relative rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/25 bg-white/20 font-semibold">
            NR
          </div>
        </div>
      </header>

      <div
        className={`grid h-[calc(100vh-68px)] grid-cols-1 overflow-hidden xl:grid-cols-[248px_minmax(0,1fr)] ${
          isDark ? 'bg-[#0b1220]' : 'bg-[#f7f9fb]'
        }`}
      >
        <aside
          className={`hidden min-h-0 overflow-hidden border-r px-4 py-4 xl:flex xl:flex-col xl:justify-between ${
            isDark
              ? 'border-[#243149] bg-[#121a2b]'
              : 'border-[#d9dde5] bg-[#f2f4f6]'
          }`}
        >
          <div className="space-y-5">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={activeTab === 'archive' && !selectedVideoId}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,63,177,0.22)] transition ${
                activeTab === 'archive' && !selectedVideoId
                  ? 'cursor-not-allowed bg-[#9aa3b2] shadow-none opacity-70'
                  : 'bg-gradient-to-r from-[#003fb1] to-[#1a56db] hover:brightness-110'
              }`}
            >
              {activeTab === 'drafts' ? (
                <Upload className="h-4 w-4" />
              ) : (
                <FolderArchive className="h-4 w-4" />
              )}
              {primaryActionLabel}
            </button>
            {activeTab === 'drafts' && (
              <input
                ref={fileInputRef}
                accept="video/*"
                className="hidden"
                type="file"
                onChange={handleUploadVideo}
              />
            )}

            <nav className="space-y-1 text-sm">
              <NavLink to="/drafts" className={navLinkClass}>
                <Files className="h-4 w-4" />
                Drafts
              </NavLink>
              <NavLink to="/archive" className={navLinkClass}>
                <FolderArchive className="h-4 w-4" />
                Archive
              </NavLink>
              <NavLink to="/" end className={navLinkClass}>
                <Clapperboard className="h-4 w-4" />
                Editor
              </NavLink>
            </nav>
          </div>

          <button
            type="button"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              isDark
                ? 'text-[#9fb0ca] hover:bg-[#182238] hover:text-[#8bb8ff]'
                : 'text-[#57657a] hover:bg-white hover:text-[#003fb1]'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </aside>

        <main
          className={`min-h-0 min-w-0 overflow-hidden ${
            isDark ? 'bg-[#0b1220]' : 'bg-[#f7f9fb]'
          }`}
        >
          <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col px-3 py-3 xl:px-4 xl:py-4">
            <div
              className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
                isDark
                  ? 'border-[#243149] bg-[#111827]'
                  : 'border-[#d9dde5] bg-white'
              }`}
            >
              <div
                className={`border-b px-6 py-5 ${
                  isDark ? 'border-[#243149]' : 'border-[#e3e7ee]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                        isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
                      }`}
                    >
                      {activeTab === 'drafts' ? 'Draft Library' : 'Archive Library'}
                    </p>
                    <h1 className="mt-2 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
                      {title}
                    </h1>
                    <p
                      className={`mt-2 max-w-2xl text-sm ${
                        isDark ? 'text-[#9fb0ca]' : 'text-[#57657a]'
                      }`}
                    >
                      {subtitle}
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${
                      isDark
                        ? 'bg-[#182238] text-[#8bb8ff]'
                        : 'bg-[#eef3ff] text-[#003fb1]'
                    }`}
                  >
                    {videos.length} videos
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {videos.map((video) => (
                    <article
                      key={video.id}
                      onClick={() => {
                        if (activeTab === 'archive') {
                          setSelectedVideoId(video.id)
                        }
                      }}
                      className={`overflow-hidden rounded-[26px] border shadow-[0_16px_40px_rgba(15,23,42,0.06)] ${
                        selectedVideoId === video.id
                          ? isDark
                            ? 'border-[#8bb8ff] bg-[#0f172a] ring-2 ring-[#2d5fb8]'
                            : 'border-[#7ea8ff] bg-white ring-2 ring-[#d8e5ff]'
                          : isDark
                            ? 'border-[#243149] bg-[#0f172a]'
                            : 'border-[#d9dde5] bg-white'
                      } ${activeTab === 'archive' ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative aspect-video bg-black">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%),linear-gradient(180deg,rgba(8,13,24,0.1),rgba(8,13,24,0.72))]" />
                        <div className="absolute inset-0 flex items-end justify-between p-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                isDark
                                  ? 'bg-white/10 text-white'
                                  : 'bg-white/18 text-white'
                              }`}
                            >
                              <Video className="h-4 w-4" />
                            </div>
                            <div className="text-white">
                              <p className="text-xs font-bold uppercase tracking-[0.18em]">
                                {video.tag}
                              </p>
                              <p className="mt-1 text-sm font-semibold">
                                {video.duration}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-base font-semibold">{video.title}</h2>
                            <p
                              className={`mt-1 text-[12px] ${
                                isDark ? 'text-[#8fa2c2]' : 'text-[#737686]'
                              }`}
                            >
                              Updated {video.updatedAt}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                              activeTab === 'drafts'
                                ? isDark
                                  ? 'bg-[#1b3566] text-[#9ec5ff]'
                                  : 'bg-[#eef3ff] text-[#003fb1]'
                                : isDark
                                  ? 'bg-[#2b2338] text-[#c9a6ff]'
                                  : 'bg-[#f2ebff] text-[#6d3cb5]'
                            }`}
                          >
                            {video.tag}
                          </span>
                        </div>
                        <p
                          className={`text-sm leading-6 ${
                            isDark ? 'text-[#9fb0ca]' : 'text-[#57657a]'
                          }`}
                        >
                          {video.notes}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
