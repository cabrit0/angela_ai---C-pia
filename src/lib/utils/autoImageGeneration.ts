import { generateImage } from '../api/aiImage';
import { createImagePromptFromQuestion } from './imageKeywords';
import type { Question, AiProvider } from '../../types';

/**
 * Automatically generates an image for a question based on its prompt
 * @param question The question object
 * @param subject Optional subject to improve keyword extraction
 * @param imageProvider The AI provider to use for image generation
 * @param token Optional token for providers that require it
 * @returns Promise that resolves to the image URL or undefined if generation fails
 */
export async function generateImageForQuestion(
  question: Question,
  subject?: string,
  imageProvider: AiProvider = 'pollinations',
  token?: string
): Promise<string | undefined> {
  try {
    console.log('Generating image for question:', question.prompt);
    console.log('Using image provider:', imageProvider);
    
    // Generate image prompt from question
    const imagePrompt = createImagePromptFromQuestion(question.prompt, subject, question.type);
    console.log('Generated image prompt:', imagePrompt);
    
    // Special handling for Pollinations to avoid CORS issues
    if (imageProvider === 'pollinations') {
      console.log('Using Pollinations direct URL generation');
      
      // Try multiple approaches for Pollinations
      const approaches = [
        // Approach 1: Direct URL with cleaned prompt
        () => {
          const cleanPrompt = imagePrompt.trim()
            .replace(/[^\w\s,.!?áéíóúàèìòùäëïöüçñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÇÑ]/g, '')
            .replace(/\s+/g, ' ')
            .substring(0, 200);
          
          const encodedPrompt = encodeURIComponent(cleanPrompt);
          const seed = Math.floor(Math.random() * 1000000);
          return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}`;
        },
        
        // Approach 2: Using text parameter instead of prompt
        () => {
          const cleanPrompt = imagePrompt.trim()
            .replace(/[^\w\s,.!?]/g, '')
            .substring(0, 100);
          
          const encodedPrompt = encodeURIComponent(cleanPrompt);
          const seed = Math.floor(Math.random() * 1000000);
          return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&model=flux`;
        },
        
        // Approach 3: Simple English prompt fallback
        () => {
          const simplePrompt = "educational illustration";
          const seed = Math.floor(Math.random() * 1000000);
          return `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=512&height=512&seed=${seed}`;
        }
      ];
      
      // Try each approach until we get a valid URL
      for (let i = 0; i < approaches.length; i++) {
        try {
          const imageUrl = approaches[i]();
          console.log(`Pollinations approach ${i + 1} URL:`, imageUrl);
          console.log('Original prompt:', imagePrompt);
          
          return imageUrl;
        } catch (error) {
          console.error(`Approach ${i + 1} failed:`, error);
          if (i === approaches.length - 1) {
            // If all approaches fail, return a simple placeholder
            console.log('All Pollinations approaches failed, using placeholder');
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y5ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2cHgiIGZpbGw9IiMzMzIj5JbYl08L3RleHQ+PC9zdmc+';
          }
        }
      }
    }
    
    // Generate image using the specified provider for non-Pollinations providers
    const result = await generateImage({
      provider: imageProvider,
      prompt: imagePrompt,
      token,
      width: 512,
      height: 512
    });
    
    console.log('Image generated successfully:', result.imageUrl);
    return result.imageUrl;
  } catch (error) {
    console.error('Error generating image for question:', error);
    // Return undefined instead of throwing to allow question creation to continue
    return undefined;
  }
}

/**
 * Generates images for multiple questions in batch
 * @param questions Array of question objects
 * @param subject Optional subject to improve keyword extraction
 * @param imageProvider The AI provider to use for image generation
 * @param token Optional token for providers that require it
 * @param batchSize Number of questions to process simultaneously (default: 3)
 * @returns Promise that resolves to an array of questions with generated images
 */
export async function generateImagesForQuestions(
  questions: Question[],
  subject?: string,
  imageProvider: AiProvider = 'pollinations',
  token?: string,
  batchSize: number = 3
): Promise<Question[]> {
  const questionsWithImages: Question[] = [];
  
  // Process questions in batches to avoid overwhelming the API
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (question) => {
      const imageUrl = await generateImageForQuestion(question, subject, imageProvider, token);
      return {
        ...question,
        imageUrl: imageUrl || question.imageUrl // Keep existing image if generation fails
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    questionsWithImages.push(...batchResults);
    
    // Add a small delay between batches to be respectful to the API
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return questionsWithImages;
}

/**
 * Generates an image for a single question with retry logic
 * @param question The question object
 * @param subject Optional subject to improve keyword extraction
 * @param imageProvider The AI provider to use for image generation
 * @param token Optional token for providers that require it
 * @param maxRetries Maximum number of retry attempts (default: 2)
 * @returns Promise that resolves to the image URL or undefined if all retries fail
 */
export async function generateImageForQuestionWithRetry(
  question: Question,
  subject?: string,
  imageProvider: AiProvider = 'pollinations',
  token?: string,
  maxRetries: number = 2
): Promise<string | undefined> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const imageUrl = await generateImageForQuestion(question, subject, imageProvider, token);
      if (imageUrl) {
        return imageUrl;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Image generation attempt ${attempt + 1} failed:`, lastError);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`All ${maxRetries + 1} image generation attempts failed for question:`, question.prompt);
  return undefined;
}