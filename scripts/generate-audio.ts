import fs from "node:fs/promises";
import path from "node:path";
import { EdgeTTS } from "node-edge-tts";
import { QUESTION_BANK, type AudioClip } from "@toeic/content";

const outputDir = path.resolve("apps/web/public/audio");
const force = process.argv.includes("--force");

function voiceFor(clip: AudioClip): string {
  if (clip.speaker === "Woman") return "en-US-JennyNeural";
  if (clip.speaker === "Man") return "en-US-GuyNeural";
  if (clip.speaker === "Speaker") return "en-GB-RyanNeural";
  return "en-US-AriaNeural";
}

async function generateClip(clip: AudioClip, output: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const tts = new EdgeTTS({
        voice: voiceFor(clip),
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "-6%",
        pitch: "default",
        volume: "default",
        timeout: 45000,
      });
      await tts.ttsPromise(clip.text, output);
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `Retrying ${path.basename(output)} after attempt ${attempt}.`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    }
  }
  throw lastError;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const clips = QUESTION_BANK.flatMap((unit) => {
    if (
      unit.stimulus.kind === "audio" ||
      unit.stimulus.kind === "image-audio"
    ) {
      return unit.stimulus.audio.clips;
    }
    return [];
  });

  for (const [index, clip] of clips.entries()) {
    const output = path.join(outputDir, path.basename(clip.src));
    if (!force) {
      try {
        const stat = await fs.stat(output);
        if (stat.size > 1000) {
          console.log(
            `[${index + 1}/${clips.length}] kept ${path.basename(output)}`,
          );
          continue;
        }
      } catch {
        // Missing output is generated below.
      }
    }

    await generateClip(clip, output);
    console.log(
      `[${index + 1}/${clips.length}] wrote ${path.basename(output)} (${clip.speaker})`,
    );
  }

  console.log(`Generated ${clips.length} bundled audio clips in ${outputDir}.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
