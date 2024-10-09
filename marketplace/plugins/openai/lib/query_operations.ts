import OpenAI from 'openai';  // Updated SDK version
import { QueryOptions } from './types';

// Utility function to convert size string to the enum value
const getSizeEnum = (size: string | undefined): '256x256' | '512x512' | '1024x1024' => {
  switch (size) {
    case '256x256':
      return '256x256';
    case '512x512':
      return '512x512';
    case '1024x1024':
      return '1024x1024';
    default:
      return '1024x1024'; // Default size
  }
};

// Utility function to convert number of images from string or number
//const getNumberOfImages = (num_images: number | string | undefined): number => {
//  const num = typeof num_images === 'string' ? parseInt(num_images) : num_images;
//  return isNaN(num) ? 1 : Math.max(1, Math.min(10, num)); // Ensure it's between 1 and 10
//};

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
  const { model, prompt, 
    //num_images,
    size } = options;
  try {
    const response = await openai.images.generate({
      model: model || 'dall-e-3',
      prompt: prompt || '',
      //n: getNumberOfImages(num_images),  Convert and validate number of images
      size: getSizeEnum(size), // Convert and validate image size
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