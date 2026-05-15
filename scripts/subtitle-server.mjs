import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HOST = process.env.SUBTITLE_API_HOST || "127.0.0.1";
const PORT = Number(process.env.SUBTITLE_API_PORT || 8787);
const LOCAL_WINDOWS_PYTHON_BIN = fileURLToPath(
  new URL("../.venv/Scripts/python.exe", import.meta.url),
);
const LOCAL_UNIX_PYTHON_BIN = fileURLToPath(
  new URL("../.venv/bin/python", import.meta.url),
);

function resolvePythonCommand() {
  const configured = process.env.FASTER_WHISPER_PYTHON?.trim();
  if (configured) {
    return { command: configured, args: [] };
  }

  if (existsSync(LOCAL_UNIX_PYTHON_BIN)) {
    return { command: LOCAL_UNIX_PYTHON_BIN, args: [] };
  }

  if (existsSync(LOCAL_WINDOWS_PYTHON_BIN)) {
    return { command: LOCAL_WINDOWS_PYTHON_BIN, args: [] };
  }

  if (process.platform === "win32") {
    return { command: "python", args: [] };
  }

  return { command: "python3", args: [] };
}

const PYTHON_COMMAND = resolvePythonCommand();
const PYTHON_BIN = PYTHON_COMMAND.command;
const WORKER_PATH = fileURLToPath(
  new URL("./faster_whisper_transcribe.py", import.meta.url),
);
const AUDIO_ACTIVITY_WORKER_PATH = fileURLToPath(
  new URL("./audio_activity_detect.py", import.meta.url),
);
const HOMEBREW_FFMPEG_BIN = "/opt/homebrew/bin/ffmpeg";
const HOMEBREW_FFPROBE_BIN = "/opt/homebrew/bin/ffprobe";
const FFMPEG_BIN =
  process.env.VIDVERSITY_FFMPEG_BIN ||
  (existsSync(HOMEBREW_FFMPEG_BIN) ? HOMEBREW_FFMPEG_BIN : "ffmpeg");
const FFPROBE_BIN =
  process.env.VIDVERSITY_FFPROBE_BIN ||
  (existsSync(HOMEBREW_FFPROBE_BIN) ? HOMEBREW_FFPROBE_BIN : "ffprobe");
const TEMP_DIR = join(tmpdir(), "vidversity-faster-whisper");
const EDITOR_SESSION_DIR = join(TEMP_DIR, "editor-sessions");
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;
const MAX_EDITOR_VERSION_HISTORY = 5;
const CUT_RANGE_MIN_GAP = 0.1;
const editorSessions = new Map();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-File-Name",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "Content-Disposition",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendBinary(response, statusCode, body, contentType, fileName) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-File-Name",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "Content-Disposition",
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
  });
  response.end(body);
}

function sanitizeFileExtension(fileName) {
  const extension = extname(fileName || "").toLowerCase();
  if (/^\.[a-z0-9]{1,8}$/.test(extension)) {
    return extension;
  }
  return ".bin";
}

function sanitizeBaseName(fileName) {
  const withoutExtension = `${fileName || "vidversity-export"}`
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");

  return withoutExtension || "vidversity-export";
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        reject(
          new Error("Uploaded file is too large for the local subtitle API."),
        );
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function parseJsonBody(buffer) {
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function sanitizeSubtitleSegments(segments) {
  if (!Array.isArray(segments)) {
    return [];
  }

  return segments
    .map((segment) => {
      const start = Number(segment?.start);
      const end = Number(segment?.end);
      const text = typeof segment?.text === "string" ? segment.text.trim() : "";

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
      }

      return {
        start,
        end,
        text,
      };
    })
    .filter(Boolean);
}

function sanitizeEditorSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("Editor session requires at least one clip segment.");
  }

  return segments.map((segment, index) => {
    const sourceRanges = Array.isArray(segment?.sourceRanges)
      ? segment.sourceRanges
          .map((range) => ({
            start: Number(range?.start),
            end: Number(range?.end),
          }))
          .filter(
            (range) =>
              Number.isFinite(range.start) &&
              Number.isFinite(range.end) &&
              range.end > range.start,
          )
      : [];
    const id = Number(segment?.id);
    const start = Number(segment?.start ?? sourceRanges[0]?.start);
    const end = Number(
      segment?.end ?? sourceRanges[sourceRanges.length - 1]?.end,
    );
    const label =
      typeof segment?.label === "string" && segment.label.trim().length > 0
        ? segment.label.trim()
        : `Clip ${index + 1}`;

    if (
      !Number.isFinite(id) ||
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      throw new Error(
        "Clip segments must include numeric id, start, and end values.",
      );
    }

    if (end <= start) {
      throw new Error("Clip segment end time must be greater than start time.");
    }

    return {
      id,
      label,
      start,
      end,
      ...(sourceRanges.length > 0 ? { sourceRanges } : {}),
    };
  });
}

function relabelEditorSegments(segments) {
  return segments.map((segment, index) => ({
    ...segment,
    label: `Clip ${index + 1}`,
  }));
}

function getEditorTimelineDuration(segments) {
  return segments.reduce(
    (sum, segment) =>
      sum +
      getEditorSegmentSourceRanges(segment).reduce(
        (rangeSum, range) => rangeSum + Math.max(0, range.end - range.start),
        0,
      ),
    0,
  );
}

function getEditorSegmentSourceRanges(segment) {
  const ranges =
    Array.isArray(segment?.sourceRanges) && segment.sourceRanges.length > 0
      ? segment.sourceRanges
      : [{ start: segment.start, end: segment.end }];

  return ranges
    .map((range) => ({
      start: Number(range.start),
      end: Number(range.end),
    }))
    .filter(
      (range) =>
        Number.isFinite(range.start) &&
        Number.isFinite(range.end) &&
        range.end > range.start,
    );
}

function normalizeEditorSegmentIds(segmentIds) {
  return Array.isArray(segmentIds)
    ? [...new Set(segmentIds.map((segmentId) => Number(segmentId)))].filter(
        (segmentId) => Number.isFinite(segmentId) && segmentId > 0,
      )
    : [];
}

function sanitizeSelectedSegmentIds(segmentIds) {
  const normalizedIds = normalizeEditorSegmentIds(segmentIds);

  if (normalizedIds.length < 2) {
    throw new Error("Select at least two clips to merge.");
  }

  return normalizedIds;
}

function sanitizeCutSegmentIds(segmentIds) {
  if (segmentIds == null) {
    return null;
  }

  const normalizedIds = normalizeEditorSegmentIds(segmentIds);
  if (normalizedIds.length === 0) {
    throw new Error("Select at least one clip to cut.");
  }

  return normalizedIds;
}

function mergeEditorSegments(segments, segmentIds, nextSegmentId) {
  const selectedSegmentIds = sanitizeSelectedSegmentIds(segmentIds);
  const selectedSegmentIdSet = new Set(selectedSegmentIds);
  const selectedIndices = [];

  segments.forEach((segment, index) => {
    if (selectedSegmentIdSet.has(segment.id)) {
      selectedIndices.push(index);
    }
  });

  if (selectedIndices.length !== selectedSegmentIds.length) {
    throw new Error(
      "One or more selected clips were not found in the editor session.",
    );
  }

  const firstSelectedIndex = selectedIndices[0];
  const lastSelectedIndex = selectedIndices[selectedIndices.length - 1];
  if (lastSelectedIndex - firstSelectedIndex + 1 !== selectedIndices.length) {
    throw new Error("Select adjacent clips to merge them into a single clip.");
  }

  const nextSegments = [];
  let mergedSegmentId = null;
  let cursorId =
    Number.isFinite(nextSegmentId) && nextSegmentId > 0 ? nextSegmentId : 1;

  for (let index = 0; index < segments.length; index += 1) {
    if (index === firstSelectedIndex) {
      const mergedSourceRanges = segments
        .slice(firstSelectedIndex, lastSelectedIndex + 1)
        .flatMap((segment) => getEditorSegmentSourceRanges(segment));
      const firstRange = mergedSourceRanges[0];
      const lastRange = mergedSourceRanges[mergedSourceRanges.length - 1];
      const sourceContiguous =
        mergedSourceRanges.length > 0 &&
        mergedSourceRanges.every((range, rangeIndex) => {
          if (rangeIndex === 0) return true;
          return (
            Math.abs(range.start - mergedSourceRanges[rangeIndex - 1].end) <
            0.001
          );
        });

      if (!firstRange || !lastRange) {
        throw new Error("Selected clips could not be merged.");
      }

      const mergedSegment = {
        id: cursorId,
        label: `Clip ${cursorId}`,
        start: firstRange.start,
        end: lastRange.end,
      };
      if (!sourceContiguous) {
        mergedSegment.sourceRanges = mergedSourceRanges;
      }

      nextSegments.push(mergedSegment);
      mergedSegmentId = cursorId;
      cursorId += 1;
      index = lastSelectedIndex;
      continue;
    }

    const segment = segments[index];
    nextSegments.push({
      ...segment,
      id: cursorId,
      label: `Clip ${cursorId}`,
    });
    cursorId += 1;
  }

  return {
    segments: relabelEditorSegments(nextSegments),
    selectedSegmentId: mergedSegmentId,
    nextSegmentId: cursorId,
  };
}

function flattenMergedEditorSegments(segments, segmentIds) {
  const selectedSegmentIds = sanitizeSelectedSegmentIds(segmentIds);
  const selectedSegmentIdSet = new Set(selectedSegmentIds);
  const selectedIndices = [];

  segments.forEach((segment, index) => {
    if (selectedSegmentIdSet.has(segment.id)) {
      selectedIndices.push(index);
    }
  });

  if (selectedIndices.length !== selectedSegmentIds.length) {
    throw new Error(
      "One or more selected clips were not found in the editor session.",
    );
  }

  const firstSelectedIndex = selectedIndices[0];
  const lastSelectedIndex = selectedIndices[selectedIndices.length - 1];
  if (lastSelectedIndex - firstSelectedIndex + 1 !== selectedIndices.length) {
    throw new Error("Select adjacent clips to merge them into a single clip.");
  }

  const nextSegments = [];
  let mergedSegmentId = null;
  let nextSegmentId = 1;
  let nextStart = 0;

  for (let index = 0; index < segments.length; index += 1) {
    if (index === firstSelectedIndex) {
      const mergedDuration = getEditorTimelineDuration(
        segments.slice(firstSelectedIndex, lastSelectedIndex + 1),
      );

      nextSegments.push({
        id: nextSegmentId,
        label: `Clip ${nextSegmentId}`,
        start: nextStart,
        end: nextStart + mergedDuration,
      });
      mergedSegmentId = nextSegmentId;
      nextSegmentId += 1;
      nextStart += mergedDuration;
      index = lastSelectedIndex;
      continue;
    }

    const segment = segments[index];
    const segmentDuration = Math.max(0, segment.end - segment.start);

    nextSegments.push({
      id: nextSegmentId,
      label: `Clip ${nextSegmentId}`,
      start: nextStart,
      end: nextStart + segmentDuration,
    });
    nextSegmentId += 1;
    nextStart += segmentDuration;
  }

  return {
    segments: relabelEditorSegments(nextSegments),
    selectedSegmentId: mergedSegmentId,
    duration: nextStart,
  };
}

function cutEditorSegmentsToRange(
  segments,
  cutStart,
  cutEnd,
  selectedSegmentIds = null,
) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return [];
  }

  const selectedSegmentIdSet =
    Array.isArray(selectedSegmentIds) && selectedSegmentIds.length > 0
      ? new Set(selectedSegmentIds)
      : null;
  let cuttableOffset = 0;
  let matchedSelectedSegments = 0;
  const nextSegments = [];

  segments.forEach((segment) => {
    const segmentDuration = Math.max(0, segment.end - segment.start);
    const isCuttable =
      selectedSegmentIdSet == null || selectedSegmentIdSet.has(segment.id);

    if (!isCuttable) {
      nextSegments.push({
        id: segment.id,
        label: segment.label,
        start: segment.start,
        end: segment.end,
      });
      return;
    }

    matchedSelectedSegments += 1;
    const editedSegmentStart = cuttableOffset;
    const editedSegmentEnd = cuttableOffset + segmentDuration;
    const overlapStart = Math.max(cutStart, editedSegmentStart);
    const overlapEnd = Math.min(cutEnd, editedSegmentEnd);

    if (overlapEnd - overlapStart >= CUT_RANGE_MIN_GAP) {
      const sourceStart = segment.start + (overlapStart - editedSegmentStart);
      const sourceEnd = segment.start + (overlapEnd - editedSegmentStart);

      nextSegments.push({
        id: segment.id,
        label: segment.label,
        start: sourceStart,
        end: sourceEnd,
      });
    }

    cuttableOffset = editedSegmentEnd;
  });

  if (
    selectedSegmentIdSet != null &&
    matchedSelectedSegments !== selectedSegmentIdSet.size
  ) {
    throw new Error(
      "One or more selected clips were not found in the editor session.",
    );
  }

  return relabelEditorSegments(nextSegments);
}

function remapDetectedSegmentsToSourceTimeline(
  selectedSegments,
  detectedSegments,
) {
  if (!Array.isArray(detectedSegments) || detectedSegments.length === 0) {
    return [];
  }

  let analysisOffset = 0;
  const remapped = [];

  selectedSegments
    .flatMap((segment) => getEditorSegmentSourceRanges(segment))
    .forEach((segment) => {
      const segmentDuration = Math.max(0, segment.end - segment.start);
      const analysisSegmentStart = analysisOffset;
      const analysisSegmentEnd = analysisOffset + segmentDuration;

      detectedSegments.forEach((detectedSegment, index) => {
        const detectedStart = Number(detectedSegment?.start_time);
        const detectedEnd = Number(detectedSegment?.end_time);

        if (!Number.isFinite(detectedStart) || !Number.isFinite(detectedEnd)) {
          return;
        }

        const overlapStart = Math.max(detectedStart, analysisSegmentStart);
        const overlapEnd = Math.min(detectedEnd, analysisSegmentEnd);

        if (overlapEnd <= overlapStart) {
          return;
        }

        remapped.push({
          start_time: segment.start + (overlapStart - analysisSegmentStart),
          end_time: segment.start + (overlapEnd - analysisSegmentStart),
          label:
            typeof detectedSegment?.label === "string" &&
            detectedSegment.label.trim().length > 0
              ? detectedSegment.label.trim()
              : `segment-${index + 1}`,
          confidence:
            detectedSegment?.confidence == null
              ? null
              : Number(detectedSegment.confidence),
        });
      });

      analysisOffset = analysisSegmentEnd;
    });

  return remapped.filter(
    (segment) =>
      Number.isFinite(segment.start_time) &&
      Number.isFinite(segment.end_time) &&
      segment.end_time - segment.start_time >= CUT_RANGE_MIN_GAP,
  );
}

function removeSilenceRangesFromEditorSegments(
  segments,
  silenceRanges,
  nextSegmentId,
) {
  const normalizedRanges = Array.isArray(silenceRanges)
    ? silenceRanges
        .map((segment) => ({
          start: Number(segment?.start),
          end: Number(segment?.end),
        }))
        .filter(
          (segment) =>
            Number.isFinite(segment.start) &&
            Number.isFinite(segment.end) &&
            segment.end - segment.start >= CUT_RANGE_MIN_GAP,
        )
        .sort((left, right) => left.start - right.start)
    : [];

  if (normalizedRanges.length === 0) {
    throw new Error("Select at least one detected silence range to delete.");
  }

  let cursorId = Number.isFinite(nextSegmentId) ? nextSegmentId : 1;
  const nextSegments = [];

  segments.forEach((segment) => {
    getEditorSegmentSourceRanges(segment).forEach((sourceRange) => {
      let keepCursor = sourceRange.start;

      normalizedRanges.forEach((range) => {
        const overlapStart = Math.max(sourceRange.start, range.start);
        const overlapEnd = Math.min(sourceRange.end, range.end);

        if (overlapEnd <= overlapStart) {
          return;
        }

        if (overlapStart - keepCursor >= CUT_RANGE_MIN_GAP) {
          nextSegments.push({
            id: cursorId,
            label: segment.label,
            start: keepCursor,
            end: overlapStart,
          });
          cursorId += 1;
        }

        keepCursor = Math.max(keepCursor, overlapEnd);
      });

      if (sourceRange.end - keepCursor >= CUT_RANGE_MIN_GAP) {
        nextSegments.push({
          id: cursorId,
          label: segment.label,
          start: keepCursor,
          end: sourceRange.end,
        });
        cursorId += 1;
      }
    });
  });

  if (nextSegments.length === 0) {
    throw new Error(
      "Deleting those silence ranges would remove the entire edit.",
    );
  }

  return {
    segments: relabelEditorSegments(nextSegments),
    nextSegmentId: cursorId,
  };
}

function serializeEditorSession(session) {
  return {
    sessionId: session.id,
    duration: session.duration,
    selectedSegmentId: session.selectedSegmentId,
    category: session.category || "",
    segments: session.segments.map((segment) => ({ ...segment })),
  };
}

function sanitizeCategory(category) {
  return typeof category === "string" ? category.trim() : "";
}

function buildEditorExportName(session, fileNameSuffix = "edited") {
  return `${sanitizeBaseName(session.fileName || "vidversity-export")}-${sanitizeBaseName(
    fileNameSuffix,
  )}.mp4`;
}

function buildEditorSourceName(session) {
  return `${sanitizeBaseName(session.fileName || "vidversity-source")}.mp4`;
}

function formatSrtTimestamp(seconds) {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1_000);
  const ms = totalMs % 1_000;
  const pad = (value, size) => `${value}`.padStart(size, "0");
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
}

function buildSrtContent(segments) {
  return segments
    .map((segment, index) => {
      const text = segment.text?.trim() || "...";
      return `${index + 1}\n${formatSrtTimestamp(segment.start)} --> ${formatSrtTimestamp(
        segment.end,
      )}\n${text}`;
    })
    .join("\n\n");
}

function remapSubtitlesForEditorTimeline(editorSegments, subtitles) {
  if (!Array.isArray(subtitles) || subtitles.length === 0) {
    return [];
  }

  const remapped = [];
  let outputOffset = 0;

  editorSegments.forEach((editorSegment) => {
    const segmentDuration = editorSegment.end - editorSegment.start;
    if (segmentDuration <= 0) {
      return;
    }

    subtitles.forEach((subtitle) => {
      const overlapStart = Math.max(editorSegment.start, subtitle.start);
      const overlapEnd = Math.min(editorSegment.end, subtitle.end);

      if (overlapEnd <= overlapStart) {
        return;
      }

      remapped.push({
        start: outputOffset + (overlapStart - editorSegment.start),
        end: outputOffset + (overlapEnd - editorSegment.start),
        text: subtitle.text,
      });
    });

    outputOffset += segmentDuration;
  });

  return remapped.filter((segment) => segment.end - segment.start >= 0.05);
}

function escapeSubtitlesFilterPath(filePath) {
  return filePath
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,");
}

function getEditorSession(sessionId) {
  const session = editorSessions.get(sessionId);
  if (!session) {
    throw new Error(
      "Editor session not found. Upload the video again to start a new session.",
    );
  }
  return session;
}

function runPythonWorker(workerPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      PYTHON_COMMAND.command,
      [...PYTHON_COMMAND.args, workerPath, ...args],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (isMissingBinaryError(error)) {
        reject(
          new Error(
            `Python is not installed or not available at ${PYTHON_COMMAND.command}. ` +
              "Set FASTER_WHISPER_PYTHON to your Python executable or activate the project virtual environment.",
          ),
        );
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `${workerPath} exited with code ${code ?? "unknown"}.`,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(
          new Error(
            `Could not parse subtitle worker output: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          ),
        );
      }
    });
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `${command} exited with code ${code ?? "unknown"}.`,
          ),
        );
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function isMissingBinaryError(error) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT",
  );
}

async function getMediaDuration(filePath) {
  try {
    const { stdout } = await runCommand(FFPROBE_BIN, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const duration = Number(stdout.trim());
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("ffprobe did not return a valid media duration.");
    }
    return duration;
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffprobe is not installed or not available at ${FFPROBE_BIN}.`,
      );
    }
    throw error;
  }
}

async function inspectMediaStreams(filePath) {
  try {
    const { stdout } = await runCommand(FFPROBE_BIN, [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type",
      "-of",
      "json",
      filePath,
    ]);

    const payload = JSON.parse(stdout);
    const streams = Array.isArray(payload?.streams) ? payload.streams : [];

    return {
      hasVideo: streams.some((stream) => stream?.codec_type === "video"),
      hasAudio: streams.some((stream) => stream?.codec_type === "audio"),
    };
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffprobe is not installed or not available at ${FFPROBE_BIN}.`,
      );
    }
    throw error;
  }
}

async function ensureSubtitleBurnSupport() {
  try {
    const { stdout } = await runCommand(FFMPEG_BIN, ["-filters"]);
    if (/\bsubtitles\b/.test(stdout)) {
      return;
    }
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffmpeg is not installed or not available at ${FFMPEG_BIN}.`,
      );
    }
    throw error;
  }

  throw new Error(
    "The installed FFmpeg build does not include the subtitles filter needed to burn captions into video. Install an FFmpeg build with libass/subtitles support, or export without burned subtitles.",
  );
}

async function normalizeMediaForTimeline(filePath, outputPath) {
  const { hasVideo, hasAudio } = await inspectMediaStreams(filePath);
  if (!hasVideo) {
    throw new Error("The uploaded file does not contain a video stream.");
  }

  const args = ["-y", "-i", filePath];

  if (!hasAudio) {
    args.push(
      "-f",
      "lavfi",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-shortest",
    );
  }

  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  );

  try {
    await runCommand(FFMPEG_BIN, args);
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffmpeg is not installed or not available at ${FFMPEG_BIN}.`,
      );
    }
    throw error;
  }
}

async function appendEditorMedia(
  existingFilePath,
  appendedFilePath,
  outputPath,
) {
  const normalizedExistingPath = join(
    EDITOR_SESSION_DIR,
    `${randomUUID()}-existing-normalized.mp4`,
  );
  const normalizedAppendedPath = join(
    EDITOR_SESSION_DIR,
    `${randomUUID()}-append-normalized.mp4`,
  );

  try {
    await normalizeMediaForTimeline(existingFilePath, normalizedExistingPath);
    await normalizeMediaForTimeline(appendedFilePath, normalizedAppendedPath);
    await runCommand(FFMPEG_BIN, [
      "-y",
      "-i",
      normalizedExistingPath,
      "-i",
      normalizedAppendedPath,
      "-filter_complex",
      "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[vout][aout]",
      "-map",
      "[vout]",
      "-map",
      "[aout]",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      outputPath,
    ]);
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffmpeg is not installed or not available at ${FFMPEG_BIN}.`,
      );
    }
    throw error;
  } finally {
    await rm(normalizedExistingPath, { force: true }).catch(() => undefined);
    await rm(normalizedAppendedPath, { force: true }).catch(() => undefined);
  }
}

async function renderEditorSegmentsToFile(filePath, segments, outputPath) {
  const { hasVideo, hasAudio } = await inspectMediaStreams(filePath);
  if (!hasVideo) {
    throw new Error("The uploaded file does not contain a video stream.");
  }

  const filterParts = [];
  const concatInputs = [];
  const renderRanges = segments.flatMap((segment) =>
    getEditorSegmentSourceRanges(segment),
  );

  renderRanges.forEach((segment, index) => {
    filterParts.push(
      `[0:v]trim=start=${segment.start}:end=${segment.end},setpts=PTS-STARTPTS[v${index}]`,
    );
    concatInputs.push(`[v${index}]`);

    if (hasAudio) {
      filterParts.push(
        `[0:a]atrim=start=${segment.start}:end=${segment.end},asetpts=PTS-STARTPTS[a${index}]`,
      );
      concatInputs.push(`[a${index}]`);
    }
  });

  filterParts.push(
    `${concatInputs.join("")}concat=n=${renderRanges.length}:v=1:a=${hasAudio ? 1 : 0}[vout]${
      hasAudio ? "[aout]" : ""
    }`,
  );

  const args = [
    "-y",
    "-i",
    filePath,
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    "[vout]",
  ];

  if (hasAudio) {
    args.push("-map", "[aout]");
  }

  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-movflags",
    "+faststart",
  );

  if (hasAudio) {
    args.push("-c:a", "aac", "-b:a", "192k");
  } else {
    args.push("-an");
  }

  args.push(outputPath);

  try {
    await runCommand(FFMPEG_BIN, args);
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffmpeg is not installed or not available at ${FFMPEG_BIN}.`,
      );
    }
    throw error;
  }
}

async function renderEditorSession(
  session,
  { segments = session.segments, subtitles = [], outputKey = "export" } = {},
) {
  const baseOutputPath = join(
    EDITOR_SESSION_DIR,
    `${session.id}-${outputKey}-base.mp4`,
  );
  const outputPath = join(EDITOR_SESSION_DIR, `${session.id}-${outputKey}.mp4`);
  await renderEditorSegmentsToFile(session.filePath, segments, baseOutputPath);

  const remappedSubtitles = remapSubtitlesForEditorTimeline(
    segments,
    subtitles,
  );

  if (remappedSubtitles.length === 0) {
    await rm(outputPath, { force: true }).catch(() => undefined);
    await writeFile(outputPath, await readFile(baseOutputPath));
    await rm(baseOutputPath, { force: true }).catch(() => undefined);
    return outputPath;
  }

  const subtitlePath = join(
    EDITOR_SESSION_DIR,
    `${session.id}-${outputKey}.srt`,
  );

  try {
    await ensureSubtitleBurnSupport();
    await writeFile(subtitlePath, buildSrtContent(remappedSubtitles), "utf8");
    await runCommand(FFMPEG_BIN, [
      "-y",
      "-i",
      baseOutputPath,
      "-vf",
      `subtitles=filename='${escapeSubtitlesFilterPath(subtitlePath)}'`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      "-c:a",
      "copy",
      outputPath,
    ]);
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(
        `ffmpeg is not installed or not available at ${FFMPEG_BIN}.`,
      );
    }
    throw error;
  } finally {
    await rm(baseOutputPath, { force: true }).catch(() => undefined);
    await rm(subtitlePath, { force: true }).catch(() => undefined);
  }

  return outputPath;
}

async function cleanupOldEditorExportVersions(
  sessionId,
  keepVersions = MAX_EDITOR_VERSION_HISTORY,
) {
  const dirEntries = await readdir(EDITOR_SESSION_DIR, { withFileTypes: true });
  const exportFiles = await Promise.all(
    dirEntries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith(`${sessionId}-export-`) &&
          entry.name.endsWith(".mp4"),
      )
      .map(async (entry) => ({
        name: entry.name,
        path: join(EDITOR_SESSION_DIR, entry.name),
        mtime: (await stat(join(EDITOR_SESSION_DIR, entry.name))).mtimeMs,
      })),
  );

  if (exportFiles.length <= keepVersions) {
    return;
  }

  const filesToRemove = exportFiles
    .sort((left, right) => right.mtime - left.mtime)
    .slice(keepVersions);

  await Promise.all(
    filesToRemove.map((file) =>
      rm(file.path, { force: true }).catch(() => undefined),
    ),
  );
}

function formatVersionTimestamp(value = Date.now()) {
  const date = new Date(value);
  const pad = (num) => `${num}`.padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function listEditorVersions(session) {
  const baseName = sanitizeBaseName(session.baseFileName);
  const prefix = `${session.id}-${baseName}_`;
  const dirEntries = await readdir(EDITOR_SESSION_DIR, {
    withFileTypes: true,
  });
  const versions = await Promise.all(
    dirEntries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith(prefix) &&
          entry.name.endsWith(".mp4"),
      )
      .map(async (entry) => {
        const filePath = join(EDITOR_SESSION_DIR, entry.name);
        const statInfo = await stat(filePath);
        return {
          fileName: entry.name,
          displayName: entry.name.slice(`${session.id}-`.length),
          isOriginal: entry.name.endsWith("_original.mp4"),
          isCurrent: filePath === session.filePath,
          sizeBytes: statInfo.size,
          createdAt: statInfo.mtimeMs,
        };
      }),
  );
  return versions.sort((left, right) => right.createdAt - left.createdAt);
}

function runFasterWhisper(tempFilePath, { model, language }) {
  const args = ["--input", tempFilePath, "--model", model];

  if (language) {
    args.push("--language", language);
  }

  return runPythonWorker(WORKER_PATH, args);
}

function runAudioActivityDetection(
  tempFilePath,
  { noiseThresholdDb, minSilenceDuration, minSegmentDuration },
) {
  const args = ["--input", tempFilePath];

  if (Number.isFinite(noiseThresholdDb)) {
    args.push("--noise-threshold-db", `${Math.round(noiseThresholdDb)}`);
  }
  if (Number.isFinite(minSilenceDuration)) {
    args.push("--min-silence-duration", `${minSilenceDuration}`);
  }
  if (Number.isFinite(minSegmentDuration)) {
    args.push("--min-segment-duration", `${minSegmentDuration}`);
  }

  return runPythonWorker(AUDIO_ACTIVITY_WORKER_PATH, args);
}

function buildSafeAISuggestion(message) {
  return {
    intent: "unknown",
    needs_review: true,
    parameters: {},
    operations: [],
    chapters: [],
    notes: [message],
  };
}

function normalizeAISuggestion(input, sourcePrompt = "") {
  const parseLooseTime = (value) => {
    if (typeof value !== "string" || value.trim().length === 0) return null;
    if (value === "END") return Number.POSITIVE_INFINITY;
    const parts = value.split(":").map((item) => Number(item));
    if (parts.some((item) => Number.isNaN(item))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };
  const allowedIntents = new Set([
    "cut",
    "split",
    "merge",
    "mute",
    "subtitle",
    "trim_silence",
    "chapter_suggest",
    "unknown",
  ]);
  const actionAliases = {
    cut: "remove",
    cut_range: "remove",
    keep_range: "keep",
    split: "split_at",
    splitAt: "split_at",
    trimSilence: "trim_silence",
    addSubtitle: "add_subtitle",
    suggestChapter: "suggest_chapter",
  };
  const allowedActions = new Set([
    "remove",
    "keep",
    "split_at",
    "mute",
    "add_subtitle",
    "trim_silence",
    "suggest_chapter",
  ]);
  const suggestion = input && typeof input === "object" ? input : {};
  const notes = Array.isArray(suggestion.notes)
    ? suggestion.notes.map((n) => `${n}`)
    : [];
  const operations = Array.isArray(suggestion.operations)
    ? suggestion.operations
    : [];
  const normalizedOperations = operations
    .map((operation) => {
      const rawAction =
        typeof operation?.action === "string" ? operation.action : "";
      const normalizedAction = allowedActions.has(rawAction)
        ? rawAction
        : actionAliases[rawAction] || null;
      if (!normalizedAction) {
        notes.push(
          "One or more operations used unsupported actions and were removed.",
        );
        return null;
      }
      return {
        action: normalizedAction,
        start: typeof operation?.start === "string" ? operation.start : null,
        end: typeof operation?.end === "string" ? operation.end : null,
        text: typeof operation?.text === "string" ? operation.text : null,
      };
    })
    .filter(Boolean);
  normalizedOperations.forEach((operation) => {
    const requiresBothBounds =
      operation.action === "remove" ||
      operation.action === "keep" ||
      operation.action === "mute" ||
      operation.action === "add_subtitle";
    const requiresStartOnly = operation.action === "split_at";
    if (
      (requiresBothBounds &&
        (operation.start == null || operation.end == null)) ||
      (requiresStartOnly && operation.start == null)
    ) {
      notes.push(
        "One or more operation timestamps are missing and require manual review.",
      );
    }
  });
  const chapters = Array.isArray(suggestion.chapters)
    ? suggestion.chapters
        .map((chapter) => ({
          title:
            typeof chapter?.title === "string" && chapter.title.trim()
              ? chapter.title.trim()
              : "Untitled chapter",
          start: typeof chapter?.start === "string" ? chapter.start : null,
          end: typeof chapter?.end === "string" ? chapter.end : null,
          summary: typeof chapter?.summary === "string" ? chapter.summary : "",
          thumbnailTime:
            typeof chapter?.thumbnailTime === "string"
              ? chapter.thumbnailTime
              : null,
        }))
        .sort((left, right) => {
          const leftValue =
            parseLooseTime(left.start) ?? Number.POSITIVE_INFINITY;
          const rightValue =
            parseLooseTime(right.start) ?? Number.POSITIVE_INFINITY;
          return leftValue - rightValue;
        })
    : [];
  if (chapters.length > 1) {
    for (let index = 1; index < chapters.length; index += 1) {
      const previousEnd = parseLooseTime(chapters[index - 1].end);
      const currentStart = parseLooseTime(chapters[index].start);
      if (
        previousEnd != null &&
        currentStart != null &&
        Number.isFinite(previousEnd) &&
        Number.isFinite(currentStart) &&
        currentStart < previousEnd
      ) {
        notes.push(
          "Chapter boundaries overlap; review continuity before applying.",
        );
        break;
      }
    }
  }
  const normalizedIntent = allowedIntents.has(suggestion.intent)
    ? suggestion.intent
    : "unknown";
  const safeOperations =
    normalizedIntent === "unknown" ? [] : normalizedOperations;
  if (normalizedIntent === "unknown" && normalizedOperations.length > 0) {
    notes.push(
      "Ambiguous intent detected; operations were cleared for safety.",
    );
  }
  const normalizedPrompt = `${sourcePrompt}`.toLowerCase();
  let fallbackIntent = normalizedIntent;
  let fallbackOperations = safeOperations;
  if (safeOperations.length === 0) {
    if (
      /cut|remove/.test(normalizedPrompt) &&
      /\d{1,2}:\d{2}/.test(normalizedPrompt)
    ) {
      const times = normalizedPrompt.match(/\d{1,2}:\d{2}(?:\.\d+)?/g) || [];
      fallbackIntent = "cut";
      fallbackOperations =
        times.length >= 2
          ? [{ action: "remove", start: times[0], end: times[1], text: null }]
          : [];
      notes.push("Fallback intent mapping used from prompt keywords.");
    } else if (
      /split/.test(normalizedPrompt) &&
      /\d{1,2}:\d{2}/.test(normalizedPrompt)
    ) {
      const time = (normalizedPrompt.match(/\d{1,2}:\d{2}(?:\.\d+)?/) || [
        null,
      ])[0];
      fallbackIntent = "split";
      fallbackOperations = time
        ? [{ action: "split_at", start: time, end: null, text: null }]
        : [];
      notes.push("Fallback intent mapping used from prompt keywords.");
    } else if (/silent|silence/.test(normalizedPrompt)) {
      fallbackIntent = "trim_silence";
      fallbackOperations = [
        { action: "trim_silence", start: null, end: null, text: null },
      ];
      notes.push("Fallback intent mapping used from prompt keywords.");
    } else if (/subtitle/.test(normalizedPrompt)) {
      fallbackIntent = "subtitle";
      fallbackOperations = [
        { action: "add_subtitle", start: null, end: null, text: null },
      ];
      notes.push("Fallback intent mapping used from prompt keywords.");
    } else if (/chapter/.test(normalizedPrompt)) {
      fallbackIntent = "chapter_suggest";
      fallbackOperations = [
        { action: "suggest_chapter", start: null, end: null, text: null },
      ];
      notes.push("Fallback intent mapping used from prompt keywords.");
    }
  }

  return {
    intent: fallbackIntent,
    needs_review: true,
    parameters:
      suggestion.parameters && typeof suggestion.parameters === "object"
        ? suggestion.parameters
        : {},
    operations: fallbackOperations,
    chapters,
    notes,
  };
}

function buildChapterSuggestionFromTranscript(transcript) {
  const normalizedTranscript = Array.isArray(transcript)
    ? transcript
        .map((segment) => ({
          start: typeof segment?.start === "string" ? segment.start : null,
          end: typeof segment?.end === "string" ? segment.end : null,
          text: typeof segment?.text === "string" ? segment.text.trim() : "",
        }))
        .filter((segment) => segment.start && segment.text.length > 0)
    : [];

  if (normalizedTranscript.length === 0) {
    return buildSafeAISuggestion(
      "Transcript or timestamps are required for chapter suggestion.",
    );
  }

  const chapterCount = Math.min(
    20,
    Math.max(2, Math.ceil(normalizedTranscript.length / 25)),
  );
  const chunkSize = Math.max(
    1,
    Math.ceil(normalizedTranscript.length / chapterCount),
  );
  const chapters = [];

  for (let index = 0; index < normalizedTranscript.length; index += chunkSize) {
    const chunk = normalizedTranscript.slice(index, index + chunkSize);
    const chapterIndex = chapters.length + 1;
    chapters.push({
      title: `Chapter ${chapterIndex}`,
      start: chunk[0]?.start ?? null,
      end: chunk[chunk.length - 1]?.end ?? null,
      summary: chunk
        .map((segment) => segment.text)
        .join(" ")
        .slice(0, 180),
      thumbnailTime: chunk[0]?.start ?? null,
    });
  }

  return {
    intent: "chapter_suggest",
    needs_review: true,
    parameters: { source: "transcript_fallback" },
    operations: [
      { action: "suggest_chapter", start: null, end: null, text: null },
    ],
    chapters,
    notes: ["Generated chapter suggestions from transcript fallback logic."],
  };
}

function preprocessTranscriptForChapterPrompt(transcript) {
  const cleaned = (Array.isArray(transcript) ? transcript : [])
    .map((segment) => ({
      start: typeof segment?.start === "string" ? segment.start : null,
      end: typeof segment?.end === "string" ? segment.end : null,
      text: typeof segment?.text === "string" ? segment.text.trim() : "",
    }))
    .filter(
      (segment) =>
        segment.start &&
        segment.end &&
        segment.text.length >= 3 &&
        /[a-zA-Z0-9]/.test(segment.text),
    );

  if (cleaned.length <= 1) {
    return cleaned;
  }

  const merged = [];
  const chunkSize = 4;
  for (let index = 0; index < cleaned.length; index += chunkSize) {
    const chunk = cleaned.slice(index, index + chunkSize);
    merged.push({
      start: chunk[0]?.start ?? null,
      end: chunk[chunk.length - 1]?.end ?? null,
      text: chunk
        .map((item) => item.text)
        .join(" ")
        .slice(0, 280),
    });
  }
  return merged;
}

function hasUsableChapters(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return false;
  const usableCount = chapters.filter((chapter) => {
    const hasRealTitle =
      typeof chapter?.title === "string" &&
      chapter.title.trim().length > 0 &&
      chapter.title.trim().toLowerCase() !== "untitled chapter";
    const hasTiming =
      typeof chapter?.start === "string" || typeof chapter?.end === "string";
    const hasSummary =
      typeof chapter?.summary === "string" && chapter.summary.trim().length > 0;
    return hasRealTitle || hasTiming || hasSummary;
  }).length;
  return usableCount > 0;
}

async function callOllamaChat(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.OLLAMA_TIMEOUT_MS || 30000),
  );
  const baseUrl = (
    process.env.OLLAMA_BASE_URL || "http://localhost:11434"
  ).replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "vidversity-edit";
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: {
          temperature: Number(process.env.OLLAMA_TEMPERATURE || 0),
          top_p: Number(process.env.OLLAMA_TOP_P || 0.9),
        },
        messages,
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        payload?.error || `Ollama request failed (${response.status}).`,
      );
    const content = payload?.message?.content;
    if (typeof content !== "string")
      throw new Error("Ollama response did not include JSON content.");
    return { parsed: JSON.parse(content), rawContent: content };
  } finally {
    clearTimeout(timeout);
  }
}
await mkdir(TEMP_DIR, { recursive: true });
await mkdir(EDITOR_SESSION_DIR, { recursive: true });

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL." });
    return;
  }

  const url = new URL(
    request.url,
    `http://${request.headers.host || "localhost"}`,
  );

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      python: PYTHON_BIN,
      worker: WORKER_PATH,
      audioActivityWorker: AUDIO_ACTIVITY_WORKER_PATH,
      editorSessions: editorSessions.size,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/") {
    sendJson(response, 200, {
      ok: true,
      message: "VidVersity subtitle API is running.",
      health: "/api/health",
      generate: "/api/subtitles/generate",
      detectSilence: "/api/audio/detect-silence",
      detectEditorSilence: "/api/editor/detect-silence",
      createEditorSession: "/api/editor/session",
      editorSource: "/api/editor/source?sessionId=...",
      editorVersions: "/api/editor/versions?sessionId=...",
      saveEditorVersion: "/api/editor/version/save",
      switchEditorVersion: "/api/editor/version/switch",
      downloadEditorVersion:
        "/api/editor/version/download?sessionId=...&versionName=...",
      deleteEditorVersion: "/api/editor/version/delete",
      replaceEditorSession: "/api/editor/session/replace",
      appendEditorMedia: "/api/editor/append?sessionId=...",
      splitEditorSession: "/api/editor/split",
      mergeEditorSession: "/api/editor/merge",
      cutEditorSession: "/api/editor/cut",
      deleteEditorSilence: "/api/editor/delete-silence",
      exportEditorSession: "/api/editor/export",
      aiEditCommand: "/api/ai/edit-command",
      aiChapterSuggestions: "/api/ai/chapter-suggestions",
      python: PYTHON_BIN,
    });
    return;
  }

  if (request.method !== "POST") {
    if (request.method === "GET" && url.pathname === "/api/editor/source") {
      const sessionId = url.searchParams.get("sessionId") || "";
      try {
        const session = getEditorSession(sessionId);
        const data = await readFile(session.filePath);
        sendBinary(
          response,
          200,
          data,
          "video/mp4",
          buildEditorSourceName(session),
        );
      } catch (error) {
        sendJson(response, 400, {
          error:
            error instanceof Error
              ? error.message
              : "Could not load the current editor source media.",
        });
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/editor/versions") {
      const sessionId = url.searchParams.get("sessionId") || "";
      try {
        const session = getEditorSession(sessionId);
        const versions = await listEditorVersions(session);
        sendJson(response, 200, { versions });
      } catch (error) {
        sendJson(response, 400, {
          error:
            error instanceof Error
              ? error.message
              : "Could not list editor source versions.",
        });
      }
      return;
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/editor/version/download"
    ) {
      const sessionId = url.searchParams.get("sessionId") || "";
      const versionName = url.searchParams.get("versionName") || "";
      try {
        const session = getEditorSession(sessionId);
        const baseName = sanitizeBaseName(session.baseFileName);
        const prefix = `${session.id}-${baseName}_`;
        if (
          !versionName.startsWith(prefix) ||
          !versionName.endsWith(".mp4") ||
          versionName.includes("/") ||
          versionName.includes("\\")
        ) {
          throw new Error("Invalid version name.");
        }
        const versionPath = join(EDITOR_SESSION_DIR, versionName);
        const data = await readFile(versionPath);
        const downloadName = versionName.slice(`${session.id}-`.length);
        sendBinary(response, 200, data, "video/mp4", downloadName);
      } catch (error) {
        sendJson(response, 400, {
          error:
            error instanceof Error
              ? error.message
              : "Could not download the requested version.",
        });
      }
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
    return;
  }

  let tempFilePath = null;
  try {
    const body = await readRequestBody(request);

    if (
      url.pathname === "/api/ai/edit-command" ||
      url.pathname === "/api/ai/chapter-suggestions"
    ) {
      const payload = parseJsonBody(body);
      const transcript = Array.isArray(payload?.transcript)
        ? payload.transcript
        : [];
      const transcriptForPrompt =
        url.pathname === "/api/ai/chapter-suggestions"
          ? preprocessTranscriptForChapterPrompt(transcript)
          : transcript;
      const prompt =
        url.pathname === "/api/ai/chapter-suggestions"
          ? "Suggest chapters by topic from the transcript and timestamps."
          : `${payload?.prompt || ""}`;
      const systemPrompt =
        "Return JSON only. needs_review must always be true. Never execute edits; only suggest operations. If intent is unknown, operations must be [].";
      try {
        const shouldMatchLocal =
          process.env.AI_MATCH_LOCAL === "1" &&
          url.pathname === "/api/ai/edit-command";
        const messages = shouldMatchLocal
          ? [{ role: "user", content: prompt }]
          : [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  `Prompt: ${prompt}`,
                  `VideoDuration: ${payload?.videoDuration || "unknown"}`,
                  `Transcript: ${JSON.stringify(transcriptForPrompt)}`,
                ].join("\n"),
              },
            ];
        const modelResponse = await callOllamaChat(messages);
        let suggestion = normalizeAISuggestion(modelResponse.parsed, prompt);
        if (url.pathname === "/api/ai/chapter-suggestions") {
          suggestion.intent = "chapter_suggest";
          if (
            !hasUsableChapters(suggestion.chapters) &&
            transcript.length > 0
          ) {
            suggestion = buildChapterSuggestionFromTranscript(transcript);
          }
          if (suggestion.operations.length === 0) {
            suggestion.operations = [
              { action: "suggest_chapter", start: null, end: null, text: null },
            ];
          }
        }
        const debugEnabled = process.env.AI_DEBUG === "1";
        sendJson(
          response,
          200,
          debugEnabled
            ? {
                suggestion,
                debug: { rawModelContent: modelResponse.rawContent, messages },
              }
            : { suggestion },
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "AI service unavailable.";
        const fallbackSuggestion =
          url.pathname === "/api/ai/chapter-suggestions" && transcript.length > 0
            ? buildChapterSuggestionFromTranscript(transcript)
            : normalizeAISuggestion(buildSafeAISuggestion(reason), prompt);
        fallbackSuggestion.notes = Array.isArray(fallbackSuggestion.notes)
          ? [reason, ...fallbackSuggestion.notes]
          : [reason];
        const debugEnabled = process.env.AI_DEBUG === "1";
        sendJson(
          response,
          200,
          debugEnabled
            ? {
                suggestion: fallbackSuggestion,
                debug: { error: reason },
              }
            : { suggestion: fallbackSuggestion },
        );
      }
      return;
    }

    if (url.pathname === "/api/editor/version/delete") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const versionName =
        typeof payload?.versionName === "string" ? payload.versionName : "";
      const session = getEditorSession(sessionId);
      const baseName = sanitizeBaseName(session.baseFileName);
      const prefix = `${session.id}-${baseName}_`;
      if (
        !versionName.startsWith(prefix) ||
        !versionName.endsWith(".mp4") ||
        versionName.includes("/") ||
        versionName.includes("\\")
      ) {
        throw new Error("Invalid version name.");
      }
      const versionPath = join(EDITOR_SESSION_DIR, versionName);
      if (versionPath === session.originalFilePath) {
        throw new Error("Cannot delete the original source version.");
      }
      if (versionPath === session.filePath) {
        throw new Error("Cannot delete the current active source version.");
      }
      await rm(versionPath, { force: true });
      const versions = await listEditorVersions(session);
      sendJson(response, 200, { ok: true, deleted: versionName, versions });
      return;
    }

    if (url.pathname === "/api/editor/version/switch") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const versionName =
        typeof payload?.versionName === "string" ? payload.versionName : "";
      const session = getEditorSession(sessionId);
      const baseName = sanitizeBaseName(session.baseFileName);
      const prefix = `${session.id}-${baseName}_`;
      if (
        !versionName.startsWith(prefix) ||
        !versionName.endsWith(".mp4") ||
        versionName.includes("/") ||
        versionName.includes("\\")
      ) {
        throw new Error("Invalid version name.");
      }

      const versionPath = join(EDITOR_SESSION_DIR, versionName);
      const duration = await getMediaDuration(versionPath);
      const switchedFileName = versionName
        .slice(`${session.id}-`.length)
        .replace(/\.mp4$/i, "");

      session.filePath = versionPath;
      session.fileName = switchedFileName;
      session.duration = duration;
      session.segments = [
        {
          id: 1,
          label: "Clip 1",
          start: 0,
          end: duration,
        },
      ];
      session.selectedSegmentId = 1;
      session.nextSegmentId = 2;

      const versions = await listEditorVersions(session);
      sendJson(response, 200, {
        session: serializeEditorSession(session),
        versions,
      });
      return;
    }

    if (url.pathname === "/api/editor/version/save") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const session = getEditorSession(sessionId);
      const exportSegments = Array.isArray(payload?.segments)
        ? sanitizeEditorSegments(payload.segments)
        : session.segments;
      const subtitles = sanitizeSubtitleSegments(payload?.subtitles);
      if (exportSegments.length === 0) {
        throw new Error("There are no segments left to save as a version.");
      }
      const baseName = sanitizeBaseName(session.baseFileName);
      const timestamp = formatVersionTimestamp();
      const outputKey = `${baseName}_${timestamp}`;
      const outputPath = await renderEditorSession(session, {
        segments: exportSegments,
        subtitles,
        outputKey,
      });
      const savedVersionName = `${session.id}-${outputKey}.mp4`;
      if (join(EDITOR_SESSION_DIR, savedVersionName) !== outputPath) {
        throw new Error(
          "Saved version path did not match the expected version name.",
        );
      }
      const versions = await listEditorVersions(session);
      const saved =
        versions.find((entry) => entry.fileName === savedVersionName) || null;
      sendJson(response, 200, { ok: true, version: saved, versions });
      return;
    }

    if (body.length === 0) {
      sendJson(response, 400, { error: "No video bytes were uploaded." });
      return;
    }

    if (url.pathname === "/api/editor/session") {
      const rawFileName = request.headers["x-file-name"];
      const fileName =
        typeof rawFileName === "string" && rawFileName.length > 0
          ? decodeURIComponent(rawFileName)
          : "upload.bin";
      const sessionId = randomUUID();
      const extension = sanitizeFileExtension(fileName);
      const baseName = sanitizeBaseName(fileName);
      const originalFileName = `${baseName}_original${extension}`;
      const filePath = join(
        EDITOR_SESSION_DIR,
        `${sessionId}-${originalFileName}`,
      );

      await writeFile(filePath, body);
      const duration = await getMediaDuration(filePath);
      const session = {
        id: sessionId,
        baseFileName: baseName,
        fileName: `${baseName}_original`,
        filePath,
        originalFilePath: filePath,
        duration,
        category: "",
        nextSegmentId: 2,
        selectedSegmentId: 1,
        segments: [
          {
            id: 1,
            label: "Clip 1",
            start: 0,
            end: duration,
          },
        ],
      };

      editorSessions.set(sessionId, session);
      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/session/replace") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const selectedSegmentId = Number(payload?.selectedSegmentId ?? 0);
      const session = getEditorSession(sessionId);
      const nextSegments = sanitizeEditorSegments(payload?.segments);

      session.segments = nextSegments;
      session.selectedSegmentId =
        Number.isFinite(selectedSegmentId) && selectedSegmentId > 0
          ? selectedSegmentId
          : (nextSegments[0]?.id ?? null);
      session.category =
        sanitizeCategory(payload?.category) || session.category || "";
      session.nextSegmentId = Math.max(
        session.nextSegmentId,
        ...nextSegments.map((segment) => segment.id + 1),
      );

      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/session/category") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const session = getEditorSession(sessionId);

      session.category = sanitizeCategory(payload?.category);

      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/append") {
      const sessionId = url.searchParams.get("sessionId") || "";
      const session = getEditorSession(sessionId);
      const rawFileName = request.headers["x-file-name"];
      const fileName =
        typeof rawFileName === "string" && rawFileName.length > 0
          ? decodeURIComponent(rawFileName)
          : "append.bin";
      const appendedInputPath = join(
        EDITOR_SESSION_DIR,
        `${randomUUID()}${sanitizeFileExtension(fileName)}`,
      );
      const versionTimestamp = formatVersionTimestamp();
      const combinedOutputPath = join(
        EDITOR_SESSION_DIR,
        `${session.id}-${sanitizeBaseName(session.baseFileName)}_${versionTimestamp}.mp4`,
      );

      await writeFile(appendedInputPath, body);

      try {
        const appendedDuration = await getMediaDuration(appendedInputPath);
        const nextSegment = {
          id: session.nextSegmentId,
          label: `Clip ${session.segments.length + 1}`,
          start: session.duration,
          end: session.duration + appendedDuration,
        };

        await appendEditorMedia(
          session.filePath,
          appendedInputPath,
          combinedOutputPath,
        );

        session.filePath = combinedOutputPath;
        session.fileName = `${sanitizeBaseName(session.baseFileName)}_${versionTimestamp}`;
        session.duration += appendedDuration;
        session.nextSegmentId += 1;
        session.segments = relabelEditorSegments([
          ...session.segments,
          nextSegment,
        ]);
        session.selectedSegmentId = nextSegment.id;

        sendJson(response, 200, serializeEditorSession(session));
      } finally {
        await rm(appendedInputPath, { force: true }).catch(() => undefined);
      }
      return;
    }

    if (url.pathname === "/api/editor/split") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const segmentId = Number(payload?.segmentId ?? 0);
      const splitTime = Number(payload?.splitTime ?? 0);
      const session = getEditorSession(sessionId);
      const splitIndex = session.segments.findIndex(
        (segment) => segment.id === segmentId,
      );

      if (splitIndex === -1) {
        throw new Error("Selected clip was not found in the editor session.");
      }

      const target = session.segments[splitIndex];
      const minGap = 0.1;
      if (
        splitTime <= target.start + minGap ||
        splitTime >= target.end - minGap
      ) {
        throw new Error("Move the playhead inside the clip before splitting.");
      }

      const leftSegment = {
        id: session.nextSegmentId,
        label: target.label,
        start: target.start,
        end: splitTime,
      };
      const rightSegment = {
        id: session.nextSegmentId + 1,
        label: target.label,
        start: splitTime,
        end: target.end,
      };

      session.nextSegmentId += 2;
      session.segments.splice(splitIndex, 1, leftSegment, rightSegment);
      session.segments = relabelEditorSegments(session.segments);
      session.selectedSegmentId = rightSegment.id;

      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/merge") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const session = getEditorSession(sessionId);
      const nextState = mergeEditorSegments(
        session.segments,
        payload?.segmentIds,
        session.nextSegmentId,
      );
      session.segments = nextState.segments;
      session.selectedSegmentId = nextState.selectedSegmentId;
      session.nextSegmentId = nextState.nextSegmentId;
      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/cut") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const rawCutStart = Number(payload?.cutStart ?? 0);
      const rawCutEnd = Number(payload?.cutEnd ?? 0);
      const session = getEditorSession(sessionId);
      const selectedSegmentIds = sanitizeCutSegmentIds(payload?.segmentIds);
      const selectedSegmentIdSet =
        selectedSegmentIds != null ? new Set(selectedSegmentIds) : null;
      const cuttableSegments =
        selectedSegmentIdSet == null
          ? session.segments
          : session.segments.filter((segment) =>
              selectedSegmentIdSet.has(segment.id),
            );
      const editedDuration = getEditorTimelineDuration(cuttableSegments);

      if (
        selectedSegmentIds != null &&
        cuttableSegments.length !== selectedSegmentIds.length
      ) {
        throw new Error(
          "One or more selected clips were not found in the editor session.",
        );
      }

      if (editedDuration <= 0) {
        throw new Error(
          "The current edit does not contain any duration to cut.",
        );
      }

      const cutStart = Math.min(
        Math.max(0, rawCutStart),
        Math.max(0, editedDuration - CUT_RANGE_MIN_GAP),
      );
      const cutEnd = Math.min(
        Math.max(cutStart + CUT_RANGE_MIN_GAP, rawCutEnd),
        editedDuration,
      );
      const nextSegments = cutEditorSegmentsToRange(
        session.segments,
        cutStart,
        cutEnd,
        selectedSegmentIds,
      );

      if (nextSegments.length === 0) {
        throw new Error(
          "Move the cut handles so the kept range includes part of the timeline.",
        );
      }

      session.segments = nextSegments;
      session.selectedSegmentId =
        (selectedSegmentIdSet != null
          ? nextSegments.find((segment) => selectedSegmentIdSet.has(segment.id))
              ?.id
          : nextSegments[0]?.id) ?? null;
      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/detect-silence") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const noiseThresholdDb = Number(payload?.noiseThresholdDb ?? -35);
      const minSilenceDuration = Number(payload?.minSilenceDuration ?? 0.5);
      const minSegmentDuration = Number(payload?.minSegmentDuration ?? 0.1);
      const session = getEditorSession(sessionId);
      const timelineSegments = session.segments.filter(
        (segment) => segment.end - segment.start >= CUT_RANGE_MIN_GAP,
      );

      if (timelineSegments.length === 0) {
        throw new Error(
          "The current timeline does not contain any clips to analyze.",
        );
      }
      const analysisFilePath = join(
        EDITOR_SESSION_DIR,
        `${session.id}-silence-analysis-${Date.now()}.mp4`,
      );

      try {
        await renderEditorSegmentsToFile(
          session.filePath,
          timelineSegments,
          analysisFilePath,
        );
        const result = await runAudioActivityDetection(analysisFilePath, {
          noiseThresholdDb,
          minSilenceDuration,
          minSegmentDuration,
        });

        sendJson(response, 200, {
          audioDuration: timelineSegments.reduce(
            (sum, segment) => sum + Math.max(0, segment.end - segment.start),
            0,
          ),
          silenceSegments: remapDetectedSegmentsToSourceTimeline(
            timelineSegments,
            result?.silence_segments,
          ),
          speechSegments: remapDetectedSegmentsToSourceTimeline(
            timelineSegments,
            result?.speech_segments,
          ),
        });
      } finally {
        await rm(analysisFilePath, { force: true }).catch(() => undefined);
      }
      return;
    }

    if (url.pathname === "/api/editor/delete-silence") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const session = getEditorSession(sessionId);
      const nextState = removeSilenceRangesFromEditorSegments(
        session.segments,
        payload?.silenceSegments,
        session.nextSegmentId,
      );

      session.segments = nextState.segments;
      session.nextSegmentId = nextState.nextSegmentId;
      session.selectedSegmentId = nextState.segments[0]?.id ?? null;

      sendJson(response, 200, serializeEditorSession(session));
      return;
    }

    if (url.pathname === "/api/editor/export") {
      const payload = parseJsonBody(body);
      const sessionId =
        typeof payload?.sessionId === "string" ? payload.sessionId : "";
      const session = getEditorSession(sessionId);
      const exportSegments = Array.isArray(payload?.segments)
        ? sanitizeEditorSegments(payload.segments)
        : session.segments;
      const subtitles = sanitizeSubtitleSegments(payload?.subtitles);
      const fileNameSuffix =
        typeof payload?.fileNameSuffix === "string" &&
        payload.fileNameSuffix.trim().length > 0
          ? payload.fileNameSuffix.trim()
          : exportSegments.length === 1
            ? exportSegments[0].label || "clip"
            : "edited";
      const outputPath = await renderEditorSession(session, {
        segments: exportSegments,
        subtitles,
        outputKey: `export-${Date.now()}`,
      });

      try {
        const data = await readFile(outputPath);
        sendBinary(
          response,
          200,
          data,
          "video/mp4",
          buildEditorExportName(session, fileNameSuffix),
        );
      } finally {
        await cleanupOldEditorExportVersions(session.id).catch(() => undefined);
      }
      return;
    }

    const model = (url.searchParams.get("model") || "base").trim();
    const language = (url.searchParams.get("language") || "").trim();
    const rawFileName = request.headers["x-file-name"];
    const fileName =
      typeof rawFileName === "string" && rawFileName.length > 0
        ? decodeURIComponent(rawFileName)
        : "upload.bin";
    tempFilePath = join(
      TEMP_DIR,
      `${randomUUID()}${sanitizeFileExtension(fileName)}`,
    );

    await writeFile(tempFilePath, body);
    if (url.pathname === "/api/subtitles/generate") {
      const result = await runFasterWhisper(tempFilePath, { model, language });
      sendJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/audio/detect-silence") {
      const noiseThresholdDb = Number(
        url.searchParams.get("noiseThresholdDb") || "-35",
      );
      const minSilenceDuration = Number(
        url.searchParams.get("minSilenceDuration") || "0.5",
      );
      const minSegmentDuration = Number(
        url.searchParams.get("minSegmentDuration") || "0.1",
      );

      console.log(
        `[SILENCE DETECT API] noise=${noiseThresholdDb}dB, minSilence=${minSilenceDuration}s, minSegment=${minSegmentDuration}s`,
      );

      const result = await runAudioActivityDetection(tempFilePath, {
        noiseThresholdDb,
        minSilenceDuration,
        minSegmentDuration,
      });
      
      console.log(
        `[SILENCE RESULT] ${result.silenceSegments?.length || 0} segments found`,
      );
      
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    sendJson(response, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Subtitle generation failed unexpectedly.",
    });
  } finally {
    if (tempFilePath) {
      await rm(tempFilePath, { force: true }).catch(() => undefined);
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`VidVersity subtitle API running at http://${HOST}:${PORT}`);
  console.log(`Using Python: ${PYTHON_BIN}`);
});
