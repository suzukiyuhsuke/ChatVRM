import { koeiromapFreeV1 } from "@/features/koeiromap/koeiromap";
import { SpeechConfig, SpeechSynthesizer } from "microsoft-cognitiveservices-speech-sdk";

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  audio: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message;
  const speakerX = req.body.speakerX;
  const speakerY = req.body.speakerY;
  const style = req.body.style;
  const apiKey = req.body.apiKey;
  const voiceName = req.body.voiceName;

  const cognitiveSpeechRegion = process.env.COGNITIVE_SPEECH_REGION;
  if (!cognitiveSpeechRegion) {
    throw new Error("cognitiveSpeechRegion is not defined.");
  }
  const cognitiveSpeechSubscriptionKey = process.env.COGNITIVE_SPEECH_SUBSCRIPTION_KEY;
  if(!cognitiveSpeechSubscriptionKey) {
    throw new Error("cognitiveSpeechSubscriptionKey is not defined.");
  }

  const cognitiveSpeechVoiceName = process.env.NEXT_PUBLIC_COGNITIVE_SPEECH_VOICE_NAME;
  if(!cognitiveSpeechVoiceName) {
    throw new Error("cognitiveSpeechVoiceName is not defined.");
  }
  

  const speechConfig = SpeechConfig.fromSubscription(cognitiveSpeechSubscriptionKey, cognitiveSpeechRegion);
  speechConfig.speechSynthesisLanguage = "ja-JP";
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat = 5;

  const synthesizer = new SpeechSynthesizer(speechConfig);

  synthesizer.speakTextAsync(message, result => {
    // resule.audioDataをbase64に変換する
    const audioData = arraybufferToBase64(result.audioData);
    const voice = { audio: "data:audio/mpeg;base64," + audioData };
    // voice の内容を返す
    res.status(200).json(voice);
  }, error => { console.log(error); });
}

// ArrayBufferをbase64に変換する
function arraybufferToBase64(array: ArrayBuffer) {
  const bytes = new Uint8Array(array);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}