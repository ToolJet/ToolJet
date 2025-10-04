import OpenAI from "openai";
import { QueryOptions } from "./types";

// Updated utility function to handle size validation based on model
const getSizeEnum = (
  model: string | undefined,
  size: string | undefined
): "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792" => {
  if (model === "dall-e-3") {
    switch (size) {
      case "1024x1024":
        return "1024x1024";
      case "1792x1024":
        return "1792x1024";
      case "1024x1792":
        return "1024x1792";
      default:
        return "1024x1024";
    }
  }

  if (model === "dall-e-2") {
    switch (size) {
      case "1024x1024":
        return "1024x1024";
      case "512x512":
        return "512x512";
      case "256x256":
        return "256x256";
      default:
        return "1024x1024";
    }
  }

  return "1024x1024";
};

//Utility function to convert number of images from string or number
/*const getNumberOfImages = (num_images: number | string | undefined): number => {
  const num = typeof num_images === 'string' ? parseInt(num_images) : num_images;
  return isNaN(num) ? 1 : Math.max(1, Math.min(10, num)); // Ensure it's between 1 and 10
};*/

export async function getCompletion(
  openai: OpenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, prompt, max_tokens, temperature, stop_sequence, suffix } =
    options;

  const response = await openai.completions.create({
    model: model || "gpt-3.5-turbo-instruct",
    prompt: prompt,
    temperature:
      typeof temperature === "string"
        ? parseFloat(temperature)
        : temperature || 0,
    max_tokens:
      typeof max_tokens === "string" ? parseInt(max_tokens) : max_tokens || 67,
    stop: stop_sequence || null,
    suffix: suffix || null,
  });

  return response.choices[0].text; // Access the response correctly
}

export async function getChatCompletion(
  openai: OpenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, prompt, max_tokens, temperature, stop_sequence } = options;

  const response = await openai.chat.completions.create({
    model: model || "gpt-4-turbo",
    temperature:
      typeof temperature === "string"
        ? parseFloat(temperature)
        : temperature || 0,
    max_tokens:
      typeof max_tokens === "string" ? parseInt(max_tokens) : max_tokens || 67,
    stop: stop_sequence || null,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content; // Ensure to access the correct part of the response
}

export async function generateImage(
  openai: OpenAI,
  options: QueryOptions
): Promise<{
  status: string;
  message: string;
  description?: string;
  data?: any;
}> {
  const { model, prompt, size } = options;

  const sdkModel = ((): string => {
    if (!model) return "gpt-image-1";
    switch (model) {
      case "dall-e-3":
        return "gpt-image-1";
      case "dall-e-2":
        return "dall-e-2";
      default:
        return model;
    }
  })();

  const response = await openai.images.generate({
    model: sdkModel,
    prompt: prompt || "",
    size: getSizeEnum(model, size), // Convert and validate image size based on the model
    //n: getNumberOfImages(num_images),  Convert and validate number of images
  });

  const first = response?.data && response.data[0] ? response.data[0] : null;
  let imageData: any = null;
  if (first) {
    if ((first as any).url) {
      imageData = { url: (first as any).url };
    } else if ((first as any).b64_json || (first as any).b64) {
      const b64 = (first as any).b64_json || (first as any).b64;
      imageData = { base64: b64 };
    } else if ((first as any).mime && (first as any).data) {
      imageData = { mime: (first as any).mime, base64: (first as any).data };
    }
  }

  return {
    status: "success",
    message: "Image generated successfully",
    data: imageData,
  };
}

export async function generateEmbedding(openai: OpenAI, options: QueryOptions) {
  const { model_embedding: model } = options;
  let input, encoding_format, dimensions;
  switch (model) {
    case "text-embedding-3-small":
      input = options.input_M1;
      encoding_format = options.encoding_format_M1;
      dimensions = options.dimensions_M1;
      break;
    case "text-embedding-3-large":
      input = options.input_M2;
      encoding_format = options.encoding_format_M2;
      dimensions = options.dimensions_M2;
      break;
    case "text-embedding-ada-002":
      input = options.input_M3;
      encoding_format = options.encoding_format_M3;
      break;
  }
  const embedding = await openai.embeddings.create({
    model: model,
    input: input,
    encoding_format: encoding_format,
    ...(dimensions !== undefined && { dimensions: Number(dimensions) }),
  });
  return embedding.data[0].embedding;
}
