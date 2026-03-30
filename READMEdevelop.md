# VidVersity Developer Notes

English first. 中文在后面。

## English

### Purpose

This document explains the current local development setup for `VidVersityV11`, including:

- how to start the frontend and local backend services
- where each feature is implemented
- which frontend functions call which backend endpoints

### Start The Project

#### 1. Frontend

```powershell
npm install
npm run dev
```

#### 2. Subtitle / Timeline / AI Local API

```powershell
npm run subtitles:server
```

API base URL:

```text
http://localhost:8787
```

Health check:

```text
http://localhost:8787/api/health
```

#### 3. Python environment for Faster-Whisper

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-faster-whisper.txt
pip install --force-reinstall ctranslate2==4.4.0 setuptools==70.0.0
```

### Main Feature Locations

#### Video upload and preview

- File: `src/pages/Home.tsx`
- Main parts:
  - `VideoPreviewPanel`
  - `handlePreviewAt()`
  - `handleTimelineSeek()`

This file controls the selected local video, subtitle state, and preview seeking.

#### Subtitles

- Frontend request: `src/subtitles/api.ts`
- Export helpers: `src/subtitles/export.ts`
- UI: `src/components/subtitles/SubtitleManager.tsx`
- Page state wiring: `src/pages/Home.tsx`
- Local backend: `scripts/subtitle-server.mjs`
- Python worker: `scripts/faster_whisper_transcribe.py`

#### Timeline split

- Frontend request: `src/components/timeline/api.ts`
- Timeline UI: `src/components/timeline/TimelinePanel.tsx`
- Shared types: `src/components/timeline/types.ts`
- Backend route: `scripts/subtitle-server.mjs`

#### AI suggestions

- Sidebar UI: `src/components/editor/AISidebar.tsx`
- Frontend API helpers: `src/components/editor/api.ts`
- Backend routes: `scripts/subtitle-server.mjs`

### Current Local API Endpoints

#### Root and health

- `GET /`
- `GET /api/health`

Implemented in:

- `scripts/subtitle-server.mjs`

#### Subtitle generation

- `POST /api/subtitles/generate`

Used by:

- `generateSubtitlesFromVideo()` in `src/subtitles/api.ts`

Handled by:

- `runFasterWhisper()` in `scripts/subtitle-server.mjs`
- `faster_whisper_transcribe.py`

#### Timeline split

- `POST /api/timeline/split`
- `GET /api/media/download/:id`

Used by:

- `splitMediaAtPlayhead()` in `src/components/timeline/api.ts`

Handled by:

- `splitMediaWithFfmpeg()` in `scripts/subtitle-server.mjs`

#### AI suggestion endpoints

- `GET /api/ai/scene-changes`
- `GET /api/ai/silence-segments`
- `GET /api/ai/transcript-suggestions`

Frontend entry:

- `fetchAISuggestions()` in `src/components/editor/api.ts`

Internal frontend calls:

- `fetchSceneChangeSuggestions()`
- `fetchSilenceSuggestions()`
- `fetchTranscriptSuggestions()`

Backend handlers:

- `buildSceneChangeSuggestions()` in `scripts/subtitle-server.mjs`
- `buildSilenceSuggestions()` in `scripts/subtitle-server.mjs`
- `buildTranscriptSuggestions()` in `scripts/subtitle-server.mjs`

### AI Suggestions Call Flow

When a video is loaded:

1. `Home.tsx` passes `hasVideo` and `durationInSeconds` into `AISidebar`.
2. `AISidebar.tsx` runs `fetchAISuggestions(durationInSeconds)` inside `useEffect`.
3. `src/components/editor/api.ts` calls the three local AI endpoints in parallel.
4. `scripts/subtitle-server.mjs` returns demo suggestions for scene, silence, and transcript analysis.
5. `AISidebar.tsx` filters the UI with `getDisplaySuggestions()` so only the first item of each kind is shown.
6. Clicking `Preview` calls `onPreviewAt(startSeconds)`.
7. `Home.tsx` receives that through `handlePreviewAt()`.
8. `videoPreviewRef.current.seekTo(...)` updates the player position.

### Subtitle Call Flow

1. User uploads a video in `VideoPreviewPanel`.
2. `Home.tsx` stores the selected file in `selectedVideoFile`.
3. `SubtitleManager.tsx` triggers `onGenerateAuto(...)`.
4. `Home.tsx` runs `handleGenerateAutoSubtitles(...)`.
5. `generateSubtitlesFromVideo()` sends the file to `POST /api/subtitles/generate`.
6. `subtitle-server.mjs` saves a temp file and runs the Python worker.
7. Returned subtitle segments are stored in `subtitleSegments`.
8. `buildVttFromSubtitles()` creates a live WebVTT preview track for the player.

### Timeline Split Call Flow

1. User uploads a video.
2. `Home.tsx` passes `mediaFile`, `currentTime`, and `duration` into `TimelinePanel`.
3. Clicking `Split at playhead` calls `splitMediaAtPlayhead(...)`.
4. The frontend sends the original media bytes to `POST /api/timeline/split`.
5. `subtitle-server.mjs` runs `splitMediaWithFfmpeg(...)`.
6. The backend returns two output clips and download URLs.
7. `TimelinePanel.tsx` updates the visible clip segments.

### Notes

- The AI suggestion endpoints are currently local demo endpoints, not full AI analysis yet.
- The subtitle API and timeline API share the same local Node server.
- If you update `scripts/subtitle-server.mjs`, restart `npm run subtitles:server`.
- If the frontend does not reflect changes, refresh the page after rebuilding or restarting.

---

## 中文

### 说明

这份文档用于说明 `VidVersityV11` 当前开发版的结构，主要包括：

- 如何启动前端和本地后端服务
- 各个功能的代码位置
- 前端函数和后端接口之间的调用关系

### 启动方式

#### 1. 启动前端

```powershell
npm install
npm run dev
```

#### 2. 启动本地字幕 / 时间轴 / AI 接口服务

```powershell
npm run subtitles:server
```

接口基础地址：

```text
http://localhost:8787
```

健康检查地址：

```text
http://localhost:8787/api/health
```

#### 3. 创建 Python 环境并安装 Faster-Whisper

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-faster-whisper.txt
pip install --force-reinstall ctranslate2==4.4.0 setuptools==70.0.0
```

### 主要功能代码位置

#### 视频上传与预览

- 文件：`src/pages/Home.tsx`
- 主要部分：
  - `VideoPreviewPanel`
  - `handlePreviewAt()`
  - `handleTimelineSeek()`

这里负责本地视频文件、字幕状态和播放器跳转。

#### 字幕功能

- 前端请求：`src/subtitles/api.ts`
- 导出工具：`src/subtitles/export.ts`
- 界面：`src/components/subtitles/SubtitleManager.tsx`
- 页面状态：`src/pages/Home.tsx`
- 本地后端：`scripts/subtitle-server.mjs`
- Python worker：`scripts/faster_whisper_transcribe.py`

#### 时间轴分割

- 前端请求：`src/components/timeline/api.ts`
- 时间轴界面：`src/components/timeline/TimelinePanel.tsx`
- 类型定义：`src/components/timeline/types.ts`
- 后端接口：`scripts/subtitle-server.mjs`

#### AI 建议

- 侧边栏界面：`src/components/editor/AISidebar.tsx`
- 前端请求封装：`src/components/editor/api.ts`
- 后端路由：`scripts/subtitle-server.mjs`

### 当前本地接口

#### 根路径与健康检查

- `GET /`
- `GET /api/health`

实现位置：

- `scripts/subtitle-server.mjs`

#### 字幕生成

- `POST /api/subtitles/generate`

前端调用函数：

- `src/subtitles/api.ts` 里的 `generateSubtitlesFromVideo()`

后端处理位置：

- `scripts/subtitle-server.mjs` 里的 `runFasterWhisper()`
- `scripts/faster_whisper_transcribe.py`

#### 时间轴分割

- `POST /api/timeline/split`
- `GET /api/media/download/:id`

前端调用函数：

- `src/components/timeline/api.ts` 里的 `splitMediaAtPlayhead()`

后端处理函数：

- `scripts/subtitle-server.mjs` 里的 `splitMediaWithFfmpeg()`

#### AI 建议接口

- `GET /api/ai/scene-changes`
- `GET /api/ai/silence-segments`
- `GET /api/ai/transcript-suggestions`

前端入口函数：

- `src/components/editor/api.ts` 里的 `fetchAISuggestions()`

前端内部会调用：

- `fetchSceneChangeSuggestions()`
- `fetchSilenceSuggestions()`
- `fetchTranscriptSuggestions()`

后端对应函数：

- `buildSceneChangeSuggestions()`
- `buildSilenceSuggestions()`
- `buildTranscriptSuggestions()`

以上都在 `scripts/subtitle-server.mjs`

### AI 建议功能调用链

当用户上传视频后：

1. `Home.tsx` 把 `hasVideo` 和 `durationInSeconds` 传给 `AISidebar`
2. `AISidebar.tsx` 在 `useEffect` 中调用 `fetchAISuggestions(durationInSeconds)`
3. `src/components/editor/api.ts` 并行请求三个本地 AI 接口
4. `scripts/subtitle-server.mjs` 返回 scene、silence、transcript 三类建议
5. `AISidebar.tsx` 再通过 `getDisplaySuggestions()` 过滤，只显示每种类型的第一条
6. 点击 `Preview` 会调用 `onPreviewAt(startSeconds)`
7. `Home.tsx` 里的 `handlePreviewAt()` 接收到时间
8. 最后调用 `videoPreviewRef.current.seekTo(...)` 让播放器跳转

### 字幕功能调用链

1. 用户在 `VideoPreviewPanel` 上传视频
2. `Home.tsx` 把文件保存到 `selectedVideoFile`
3. `SubtitleManager.tsx` 触发 `onGenerateAuto(...)`
4. `Home.tsx` 执行 `handleGenerateAutoSubtitles(...)`
5. `generateSubtitlesFromVideo()` 把视频发送到 `POST /api/subtitles/generate`
6. `subtitle-server.mjs` 把文件保存到临时目录并调用 Python worker
7. 返回的字幕段落保存到 `subtitleSegments`
8. `buildVttFromSubtitles()` 生成播放器用的 WebVTT 预览轨道

### 时间轴分割调用链

1. 用户上传视频
2. `Home.tsx` 把 `mediaFile`、`currentTime`、`duration` 传给 `TimelinePanel`
3. 点击 `Split at playhead` 时调用 `splitMediaAtPlayhead(...)`
4. 前端把原始媒体文件发送到 `POST /api/timeline/split`
5. `subtitle-server.mjs` 调用 `splitMediaWithFfmpeg(...)`
6. 后端返回两个分割后的片段和下载地址
7. `TimelinePanel.tsx` 更新界面上的片段显示

### 备注

- 目前 AI 建议接口还是本地演示接口，还不是真实 AI 分析
- 字幕接口和时间轴接口共用同一个本地 Node 服务
- 如果你修改了 `scripts/subtitle-server.mjs`，需要重启 `npm run subtitles:server`
- 如果前端没有马上看到变化，刷新页面即可
