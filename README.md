# VidVersity Video Editor

English version first. 中文版本在后面。

## English

### Overview

VidVersity Video Editor is a React-based video editing prototype for local use.  
It currently includes:

- local video upload and preview
- timeline editing UI
- AI suggestion sidebar
- automatic subtitle generation with Faster-Whisper
- subtitle export to `.srt` and `.vtt`

The frontend runs as a local web app. Subtitle generation is handled by a local Node API that calls a Python Faster-Whisper worker.

### Tech Stack

- Frontend: React + TypeScript
- Build tool: esbuild
- Styling: Tailwind CSS
- Subtitle backend: Node.js + Python
- Speech-to-text: Faster-Whisper

### Project Structure

- `src/pages/Home.tsx`  
  Main page, video preview, subtitle state, export actions.

- `src/components/subtitles/SubtitleManager.tsx`  
  Subtitle generation, editing, deleting, and export UI.

- `src/components/editor/AISidebar.tsx`  
  AI suggestion sidebar.

- `src/components/timeline/*`  
  Timeline and clip editing UI.

- `src/subtitles/api.ts`  
  Frontend client for calling the subtitle API.

- `src/subtitles/export.ts`  
  Helpers for building and downloading `.srt` and `.vtt`.

- `scripts/subtitle-server.mjs`  
  Local Node subtitle API server.

- `scripts/faster_whisper_transcribe.py`  
  Python Faster-Whisper worker script.

- `scripts/build.mjs`  
  Frontend development and production build script.

- `requirements-faster-whisper.txt`  
  Python dependencies for subtitle generation.

### Requirements

- Node.js
- Python 3.12 or a compatible Python 3 environment
- Internet connection for the first Whisper model download

### Setup

#### 1. Install frontend dependencies

```powershell
npm install
```

#### 2. Create a Python virtual environment

```powershell
python -m venv .venv
.venv\Scripts\activate
```

#### 3. Install subtitle dependencies

```powershell
pip install -r requirements-faster-whisper.txt
pip install --force-reinstall ctranslate2==4.4.0 setuptools==70.0.0
```

The pinned `ctranslate2` and `setuptools` versions are used because they were verified to work correctly on the local Windows setup used for this project.

### Start The Services

#### Start subtitle API

```powershell
npm run subtitles:server
```

Health check:

```text
http://localhost:8787/api/health
```

#### Start frontend

```powershell
npm run dev
```

#### Production build

```powershell
npm run build
```

### Local API Endpoints

#### `GET /`

Returns a simple API status message.

Implemented in:

- `scripts/subtitle-server.mjs`

#### `GET /api/health`

Returns:

- `ok`
- Python executable path
- worker script path

Implemented in:

- `scripts/subtitle-server.mjs`

#### `POST /api/subtitles/generate`

Generates subtitle segments from uploaded video bytes.

Query parameters:

- `model`
- `language`

Headers:

- `Content-Type`
- `X-File-Name`

Frontend caller:

- `src/subtitles/api.ts`

Backend handler:

- `scripts/subtitle-server.mjs`
- `scripts/faster_whisper_transcribe.py`

### Feature Locations

#### Video preview

- file: `src/pages/Home.tsx`
- role: upload local video, play video, attach WebVTT subtitle preview track

#### Timeline

- files: `src/components/timeline/*`
- role: playhead-linked timeline editing interface

#### AI suggestions

- file: `src/components/editor/AISidebar.tsx`
- role: previewable AI suggestion cards

#### Subtitle generation

- UI trigger: `src/components/subtitles/SubtitleManager.tsx`
- state management: `src/pages/Home.tsx`
- frontend request: `src/subtitles/api.ts`
- Node API: `scripts/subtitle-server.mjs`
- Python worker: `scripts/faster_whisper_transcribe.py`

#### Subtitle export

- file: `src/subtitles/export.ts`
- supported formats:
  - `.srt`
  - `.vtt`

#### Subtitle preview track

- file: `src/pages/Home.tsx`
- helper used: `buildVttFromSubtitles(...)`

### User Workflow

1. Start the subtitle API.
2. Start the frontend.
3. Upload a local video.
4. Click `Generate subtitles`.
5. Edit subtitle text if needed.
6. Export as `.srt` or `.vtt`.

### Notes

- The first model run may download Whisper model files from Hugging Face.
- The subtitle UI currently defaults to a safer model option for local Windows usage.
- VAD filtering is disabled by default in the Python worker to avoid `onnxruntime` issues on some Windows machines.

---

## 中文

### 项目简介

VidVersity Video Editor 是一个基于 React 的本地视频编辑原型。  
目前支持：

- 本地视频上传与预览
- 时间轴编辑界面
- AI 建议侧边栏
- 基于 Faster-Whisper 的自动字幕生成
- 导出 `.srt` 和 `.vtt` 字幕文件

前端以本地网页方式运行，字幕生成通过本地 Node API 调用 Python 的 Faster-Whisper worker 完成。

### 技术栈

- 前端：React + TypeScript
- 构建工具：esbuild
- 样式：Tailwind CSS
- 字幕后端：Node.js + Python
- 语音转文字：Faster-Whisper

### 项目结构

- `src/pages/Home.tsx`  
  主页面，负责视频预览、字幕状态管理、字幕导出。

- `src/components/subtitles/SubtitleManager.tsx`  
  字幕生成、编辑、删除、导出界面。

- `src/components/editor/AISidebar.tsx`  
  AI 建议侧边栏。

- `src/components/timeline/*`  
  时间轴和片段编辑界面。

- `src/subtitles/api.ts`  
  前端调用字幕接口的位置。

- `src/subtitles/export.ts`  
  生成并下载 `.srt`、`.vtt` 的工具函数。

- `scripts/subtitle-server.mjs`  
  本地 Node 字幕 API 服务。

- `scripts/faster_whisper_transcribe.py`  
  Python Faster-Whisper 转写脚本。

- `scripts/build.mjs`  
  前端开发与生产构建脚本。

- `requirements-faster-whisper.txt`  
  字幕服务所需 Python 依赖。

### 环境要求

- Node.js
- Python 3.12 或兼容的 Python 3 环境
- 首次下载 Whisper 模型时需要联网

### 安装步骤

#### 1. 安装前端依赖

```powershell
npm install
```

#### 2. 创建 Python 虚拟环境

```powershell
python -m venv .venv
.venv\Scripts\activate
```

#### 3. 安装字幕依赖

```powershell
pip install -r requirements-faster-whisper.txt
pip install --force-reinstall ctranslate2==4.4.0 setuptools==70.0.0
```

这里固定 `ctranslate2` 和 `setuptools` 版本，是因为这些版本已经在当前项目的 Windows 本地环境中验证可用。

### 启动服务

#### 启动字幕 API

```powershell
npm run subtitles:server
```

健康检查地址：

```text
http://localhost:8787/api/health
```

#### 启动前端

```powershell
npm run dev
```

#### 生产构建

```powershell
npm run build
```

### 本地接口说明

#### `GET /`

返回简单的服务状态信息。

实现位置：

- `scripts/subtitle-server.mjs`

#### `GET /api/health`

返回内容包括：

- `ok`
- 当前 Python 可执行文件路径
- worker 脚本路径

实现位置：

- `scripts/subtitle-server.mjs`

#### `POST /api/subtitles/generate`

接收上传的视频字节流并返回字幕分段结果。

查询参数：

- `model`
- `language`

请求头：

- `Content-Type`
- `X-File-Name`

前端调用位置：

- `src/subtitles/api.ts`

后端处理位置：

- `scripts/subtitle-server.mjs`
- `scripts/faster_whisper_transcribe.py`

### 功能代码位置

#### 视频预览

- 文件：`src/pages/Home.tsx`
- 作用：本地视频上传、播放、挂载 WebVTT 字幕预览轨道

#### 时间轴

- 文件：`src/components/timeline/*`
- 作用：与播放头联动的时间轴编辑界面

#### AI 建议

- 文件：`src/components/editor/AISidebar.tsx`
- 作用：可预览的 AI 建议卡片

#### 字幕生成

- UI 入口：`src/components/subtitles/SubtitleManager.tsx`
- 页面状态：`src/pages/Home.tsx`
- 前端请求：`src/subtitles/api.ts`
- Node API：`scripts/subtitle-server.mjs`
- Python worker：`scripts/faster_whisper_transcribe.py`

#### 字幕导出

- 文件：`src/subtitles/export.ts`
- 支持格式：
  - `.srt`
  - `.vtt`

#### 视频内字幕预览轨道

- 文件：`src/pages/Home.tsx`
- 使用函数：`buildVttFromSubtitles(...)`

### 使用流程

1. 启动字幕 API。
2. 启动前端。
3. 上传本地视频。
4. 点击 `Generate subtitles`。
5. 如果需要，编辑字幕文本。
6. 导出 `.srt` 或 `.vtt`。

### 备注

- 首次运行模型时，可能需要从 Hugging Face 下载模型文件。
- 当前字幕界面默认使用更稳妥的模型选项，适合本地 Windows 环境。
- Python worker 默认关闭了 VAD 过滤，以避免部分 Windows 机器上出现 `onnxruntime` 问题。
