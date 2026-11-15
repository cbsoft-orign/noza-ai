import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export async function transcribeAudioFromUrl(url: string) {
  if (!process.env.OPENAI_API_KEY) {
    return 'Mfite umuceri 2';
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Media download failed: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = `voice-${Date.now()}.ogg`;
  const tempFile = path.join(process.cwd(), 'tmp', fileName);
  await fs.mkdir(path.dirname(tempFile), { recursive: true });
  await fs.writeFile(tempFile, buffer);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = new File([buffer], fileName, { type: 'audio/ogg' });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'rw',
  });

  return transcription.text || 'Mfite umuceri 2';
}

export async function generateVoiceNote(text: string) {
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    return null;
  }

  const client = new TextToSpeechClient();
  const request: any = {
    input: { text },
    voice: { languageCode: 'rw-RW', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const result = await client.synthesizeSpeech(request);
  return result?.[0]?.audioContent ?? null;
}
