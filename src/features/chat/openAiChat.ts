import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { Message } from "../messages/messages";
import { Logger } from "@gltf-transform/core";
import { log } from "console";
import next from "next";

export async function getChatResponse(messages: Message[], apiKey: string) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }


  const endpoint = process.env.NEXT_PUBLIC_AOAI_ENDPOINT;
  if(!endpoint) {
    throw new Error("Invalid Endpoint");
  }

  const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

  const deploymentId = "gpt-3.5-turbo";

  const { choices } = await client.getChatCompletions(deploymentId, messages);
  const [aiRes] = choices;
  const message = aiRes.message?.content || "エラーが発生しました";

  return { message: message };
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string
) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  console.log(messages);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
//    Authorization: `Bearer ${apiKey}`,
    "api-key": apiKey,
  };
  const aoaiStreamAPIEndpoint = process.env.NEXT_PUBLIC_AOAI_STREAM_API_ENDPOINT;
  if(!aoaiStreamAPIEndpoint) {
    throw new Error("Invalid Endpoint");
  }
  const res = await fetch(aoaiStreamAPIEndpoint, {
    headers: headers,
    method: "POST",
    body: JSON.stringify({
      //model: "gpt-3.5-turbo",
      messages: messages,
      stream: true,
      //max_tokens: 200,
    }),
  });

  const reader = res.body?.getReader();
  if (res.status !== 200 || !reader) {
    throw new Error("Something went wrong");
  }

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder("utf-8");
      try {
        while (true) {
          const { done, value } = await reader.read();
          console.log("value: " + value);
          if (done) break;
          const data = decoder.decode(value);
          // console.log(value);
          // console.log(data);
          const chunks = data
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]");
          for (const chunk of chunks) {
            console.log("chunk:" + chunk);
            const json = JSON.parse(chunk);
            // console.log(json);
            // console.log(json.choices.length);
            if(json.choices.length != 0) {
              const messagePiece = json.choices[0].delta.content;
              if (!!messagePiece) {
                controller.enqueue(messagePiece);
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return stream;
}
