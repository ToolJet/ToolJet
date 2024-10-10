import OpenAI from 'openai';  // Updated SDK version
import { QueryOptions } from './types';

// Updated utility function to handle size validation based on model
const getSizeEnum = (model: string | undefined, size: string | undefined): '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' => {
  // If the model is DALL-E 3, only allow 1024x1024, 1792x1024, or 1024x1792
  if (model === 'dall-e-3') {
    switch (size) {
      case '1024x1024':
        return '1024x1024';
      case '1792x1024':
        return '1792x1024';
      case '1024x1792':
        return '1024x1792';
      default:
        return '1024x1024'; // Default size for DALL-E 3
    }
  }

  // If the model is DALL-E 2, only allow 1024x1024, 512x512, or 256x256
  if (model === 'dall-e-2') {
    switch (size) {
      case '1024x1024':
        return '1024x1024';
      case '512x512':
        return '512x512';
      case '256x256':
        return '256x256';
      default:
        return '1024x1024'; // Default size for DALL-E 2
    }
  }

  // Default size if model is not recognized
  return '1024x1024';
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
  const { model, prompt, max_tokens, temperature, stop_sequence, suffix } = options;

  try {
    const response = await openai.completions.create({
      model: model || 'gpt-3.5-turbo-instruct',
      prompt: prompt,
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
      max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
      stop: stop_sequence || null,
      suffix: suffix || null,
    });

    return response.choices[0].text; // Access the response correctly
  } catch (error) {
    console.log('Error openai ===============', error);

    return {
      error: error?.message,
      statusCode: error?.response?.status,
    };
  }
}

export async function getChatCompletion(
  openai: OpenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, prompt, max_tokens, temperature, stop_sequence } = options;

  try {
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4-turbo',
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
      max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
      stop: stop_sequence || null,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content; // Ensure to access the correct part of the response
  } catch (error) {
    return {
      error: error?.message,
      statusCode: error?.response?.status,
    };
  }
}

export async function generateImage(
  openai: OpenAI,
  options: QueryOptions
): Promise<{ status: string; message: string; description?: string; data?: any }> {
  const { model, prompt, size/* , n */ } = options;

  try {
    const response = await openai.images.generate({
      model: model || 'dall-e-3',
      prompt: prompt || '',
      size: getSizeEnum(model, size), // Convert and validate image size based on the model
      //n: getNumberOfImages(num_images),  Convert and validate number of images
    });

    // Return the URL of the first image as a JSON object
    return { 
      status: "success",
      message: "Image generated successfully",
      data: { url: response.data[0].url } 
    };
  } catch (error: any) {
    console.error("Error in image generation:", error);

    return {
      status: "failed",
      message: "Query could not be completed",
      description: error?.response?.data?.error?.message || 'An unexpected error occurred',
      data: error?.response?.data || {}
    };
  }
}