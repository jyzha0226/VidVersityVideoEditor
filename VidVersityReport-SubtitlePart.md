# VidVersity Video Editor report- subtitle part

# **Subtitle Generation Overview**

This note describes how subtitle generation currently works in VidVersity Video Editor and outlines practical upgrade paths for future work. It is written to be suitable for internal documentation or a final project report.

## **Current Approach**

The current subtitle generation feature is local-first and low-cost.

- The frontend calls a local API when the user presses `Generate`.
- The current UI sends the uploaded video file to `POST /api/subtitles/generate`.
- The current implementation uses the `tiny.en` Faster-Whisper model with the language hint set to English.
- The local Node service writes the uploaded file to a temporary directory, then launches a Python worker.
- The Python worker uses Faster-Whisper to transcribe the file and returns subtitle segments as JSON.
- The frontend receives the subtitle segments and displays them in the editor, where they can be reviewed, edited, and exported as SRT or VTT.

In code, the main flow is:

- Home.tsx: triggers subtitle generation using `tiny.en` and `en`
- api.ts: uploads the media file to the local subtitle API
- subtitle-server.mjs: spawns the Python transcription worker
- faster_whisper_transcribe.py: loads `WhisperModel` and transcribes the input file

## **Why It Is Slightly Slow**

The current solution is free to run after setup, but speed is limited by a few design choices:

- Subtitle generation runs locally on the user machine rather than on a dedicated server.
- The app currently uses CPU-based transcription by default.
- The whole uploaded media file is sent to the backend and written to temporary storage before transcription starts.
- A small free model such as `tiny.en` is lightweight, but longer videos still take noticeable time on CPU.
- The system currently performs subtitle generation as a single request rather than as a background job with progress updates.

Even with these limits, the current design is a strong low-cost choice for a student project because it avoids recurring API charges and works without a production cloud backend.

## **Strengths Of The Current Design**

- Free for local setup
- Good enough quality for many English academic or presentation videos
- support multi international language, right now only English applied
- Works without a paid speech API
- Keeps the architecture simple and easy to explain
- Allows manual subtitle correction inside the editor

## **Current Limitations**

- Performance depends heavily on the user device
- Accuracy may drop for noisy audio, strong accents, multiple speakers, or technical vocabulary
- The current UI is fixed to an English-only model path (`tiny.en`)
- International multi-language subtitle generation is not yet exposed in the current UI, even though this is a useful future extension for broader deployment
- There is no progress bar, queue, or background job tracking during transcription
- There is no speaker diarization, domain adaptation, or punctuation/post-processing pipeline beyond the base model output

## **Improvements Before Moving To Paid Services**

If the team wants to improve the current system while staying mostly local and low-cost, these are the next practical steps:

1. Allow model selection in the UI. Using `base`, `small`, or `medium` can improve accuracy, although it increases runtime.
2. Support non-English and auto language detection. The backend already accepts a language parameter, so the UI can expose this instead of always sending English.
3. Add international multi-language support as a formal product feature. This would allow the editor to support a wider range of learners, lecturers, and content creators beyond English-only use cases.
4. Add GPU support where available. Faster-Whisper can run much faster on machines with suitable GPU support.
5. Add subtitle post-processing. The app can improve readability by merging very short subtitle lines, limiting subtitle length, and normalizing punctuation/capitalization.
6. Add progress feedback. A progress indicator or background job status would improve the user experience even if raw transcription time stays the same.
7. Cache downloaded models locally. This avoids repeated model download costs and makes the workflow more reliable on unstable networks.

## **Paid Upgrade Paths**

If the project later needs better accuracy, faster turnaround, or less device dependence, moving subtitle generation to a paid speech-to-text provider is a reasonable next step.

### **Option 1: Managed API Transcription**

This approach uploads audio or video to a hosted speech-to-text provider and receives subtitle segments back through an API.

Benefits:

- easier deployment for end users
- less dependency on local Python, DLLs, and model downloads
- predictable performance
- simpler support for scaling beyond one user machine

Good fit when:

- the app is deployed for many users
- the team wants fewer local setup problems
- the team is comfortable sending media to an external provider

### **Option 2: Faster Cloud Or Batch Transcription**

Some platforms provide optimized fast or batch transcription, which is useful for longer prerecorded video files.

Benefits:

- faster turnaround on long files
- better handling of queued or bulk jobs
- easier future integration with progress polling and job tracking

Good fit when:

- subtitle generation becomes part of a repeatable production workflow
- the team expects many long lecture or presentation videos

### **Option 3: Custom Or Domain-Adapted Speech Models**

Some paid platforms support custom speech adaptation for specialist vocabulary, named entities, or repeated speaking contexts.

Benefits:

- better accuracy for academic, technical, or brand-specific language
- improved recognition of repeated course terms, lecturer names, and subject-specific jargon

Good fit when:

- the main transcription errors come from terminology rather than general speech quality

## **Example Paid Services To Evaluate**

As of May 1, 2026, these are common paid directions for future implementation:

- OpenAI Audio API: useful if the team wants an API-based speech-to-text workflow; OpenAI documents speech-to-text endpoints for `transcriptions` and `translations`, and notes a 25 MB file limit in the Audio API FAQ. Source: [https://help.openai.com/en/articles/7031512-audio-api-faq](https://help.openai.com/en/articles/7031512-audio-api-faq)
- Azure AI Speech: useful if the team wants real-time, fast, batch, or custom speech-to-text options in a managed cloud platform. Sources: [https://learn.microsoft.com/en-us/azure/ai-services/speech-service/](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/) [https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text)
- Deepgram STT: useful if the team wants API-first support for prerecorded files and streaming speech use cases. Source: [https://developers.deepgram.com/docs/stt/getting-started](https://developers.deepgram.com/docs/stt/getting-started)

These services should be evaluated against:

- cost per hour or per file
- privacy and data handling requirements
- language support
- subtitle formatting quality
- turnaround time
- support for streaming, batch processing, or diarization

## **Recommended Future Path**

For this project, the most reasonable staged plan is:

1. Keep the current local Faster-Whisper pipeline for the present submission because it is free, explainable, and already integrated.
2. Improve usability by adding model selection, language selection, international multi-language support, and better progress/error feedback.
3. If the product later needs better speed and easier deployment, move subtitle generation to a managed paid API.
4. If subtitle quality becomes a core product requirement, evaluate custom or domain-adapted speech services.

## **Short Report Summary**

The current VidVersity subtitle feature uses a local Faster-Whisper pipeline to generate subtitle segments from uploaded video files. This approach is low-cost (0 cost, as it is the open source model) and suitable for this project because it avoids recurring API fees and integrates directly into the editor. Its main trade-off is slower performance on CPU-only machines and variable accuracy for more difficult audio. At present, the project is effectively English-focused because the UI uses the `tiny.en` model and English language hint by default, but the design can be extended in future to support international multi-language subtitle generation. Additional future improvements include exposing model and language options, adding progress feedback, enabling GPU acceleration, or replacing the local transcription stage with a paid managed speech-to-text API for faster and more scalable production use.