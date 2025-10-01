import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize GenAI with proper error handling
let genAI: GoogleGenerativeAI | null = null;

function initializeGenAI() {
  try {
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
      console.warn('GEMINI_API_KEY is not defined in environment variables');
    }
  } catch (error) {
    console.error('Failed to initialize Google Generative AI:', error);
  }
}

initializeGenAI();

export async function POST(request: Request) {
  try {
    let prompt = "";
    let context = null;
  let imageData = null;
    
    // Safely parse JSON with error handling
    try {
      const body = await request.json();
      console.log('[AI API] Body received:', body);
      prompt = body.prompt || body.message || "";
      context = body.context || null;
      imageData = body.imageData || null; // Base64 image data
    } catch (parseError) {
      console.log('Invalid JSON in request, using defaults', parseError);
      // Use defaults if JSON parsing fails
    }
    
    // Log the request to debug infinite loops (context available for future use)
    console.log(`[AI API] Request received: ${prompt.substring(0, 50)}...`, context ? 'with context' : 'no context');
    
    const lowerPrompt = prompt.toLowerCase();
    let responseText = "";
    const suggestions: string[] = [];
    let actions: Array<{type: string, payload: {href?: string}}> = [];

    // Handle image analysis (if imageData is provided)
    // Prepare optional image input
    const imagePart = imageData ? [{
      inlineData: {
        data: imageData.split(',')[1] || imageData, // support data URLs
        mimeType: imageData.includes('image/') ? imageData.substring(imageData.indexOf(':') + 1, imageData.indexOf(';')) : 'image/png'
      }
    }] : [];

    // PRIORITY 1: Try to use Gemini AI for ALL requests
    if (genAI && prompt.trim()) {
      try {
        console.log('[AI API] Attempting Gemini AI response...');
        
        // Try multiple models for better success rate
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];
        let success = false;
        
        for (const modelName of models) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // Create intelligent prompt based on request type
            const ctx = context as unknown as { userHistory?: string[] } | null;
            const historyText = Array.isArray(ctx?.userHistory) && ctx?.userHistory.length
              ? `\n\nRingkasan percakapan sebelumnya (ringkas):\n${(ctx!.userHistory!).slice(-8).join('\n')}`
              : '';
            const enhancedPrompt = `Anda adalah AI assistant yang sangat membantu dan expert dalam berbagai bidang.${historyText}\n\nPermintaan user sekarang: "${prompt}"

Instruksi:
- Jika diminta membuat kode, berikan kode yang lengkap, fungsional, dan siap dijalankan
- Jika diminta puisi, buatlah puisi yang indah dan bermakna
- Jika diminta membuka website, berikan response singkat dan action redirect
- Jika diminta informasi, berikan jawaban yang akurat dan helpful
- Selalu gunakan bahasa Indonesia yang natural
- Berikan response yang sesuai dengan permintaan user

Response harus dalam format yang rapi dan mudah dibaca.`;

            // If image is attached, use multimodal input
            let result;
            if (imagePart.length > 0) {
              type Part = { text?: string } | { inlineData?: { data: string; mimeType: string } };
              const parts: Part[] = [{ text: enhancedPrompt }, ...(imagePart as Part[])];
              result = await model.generateContent(parts as unknown as string);
            } else {
              result = await model.generateContent(enhancedPrompt);
            }
            const response = await result.response;
            responseText = response.text();
            
            // Handle URL redirect if detected in prompt
            if (lowerPrompt.includes('buka') || lowerPrompt.includes('open') || lowerPrompt.includes('.com') || lowerPrompt.includes('http')) {
              let url = '';
              
              if (lowerPrompt.includes('google')) {
                url = 'https://google.com';
              } else if (lowerPrompt.includes('youtube')) {
                url = 'https://youtube.com';
              } else if (lowerPrompt.includes('facebook')) {
                url = 'https://facebook.com';
              } else if (lowerPrompt.includes('instagram')) {
                url = 'https://instagram.com';
              } else {
                const urlMatch = prompt.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|org|net|edu|gov|id|co\.id)[^\s]*)/i);
                if (urlMatch) {
                  url = urlMatch[0];
                  if (!url.startsWith('http')) {
                    url = 'https://' + url;
                  }
                }
              }
              
              if (url) {
                actions = [{ type: 'redirect', payload: { href: url } }];
                responseText = `Baik! Saya akan membuka ${url} untuk Anda.\n\n${responseText}`;
              }
            }
            
            success = true;
            console.log(`[AI API] SUCCESS with model: ${modelName}`);
            break;
            
          } catch (modelError: unknown) {
            const msg = (modelError as { message?: string })?.message || String(modelError);
            console.log(`[AI API] Model ${modelName} failed:`, msg);
            continue;
          }
        }
        
        if (!success) {
          throw new Error('All Gemini models failed');
        }
        
      } catch (error) {
        console.error('[AI API] Gemini AI error:', error);
        
        // FALLBACK: Only use minimal hardcoded responses as last resort
        if (lowerPrompt.includes('puisi') || lowerPrompt.includes('poem')) {
          responseText = `Berikut adalah puisi untuk Anda:

**Harapan Pagi**

Mentari pagi mulai terbit,
Membawa harapan di hati,
Setiap langkah yang kita tempuh,
Adalah jalan menuju mimpi.

Semoga hari ini membawa kebahagiaan untuk Anda! 🌅`;
        } else if (lowerPrompt.includes('motivasi') || lowerPrompt.includes('semangat')) {
          responseText = `💪 **Motivasi untuk Anda:**

"Setiap hari adalah kesempatan baru untuk menjadi lebih baik. Jangan menyerah pada impian Anda!"

Tetap semangat! 🌟`;
        } else {
          responseText = `Maaf, saat ini AI sedang mengalami gangguan teknis. Namun saya tetap siap membantu Anda!

Silakan coba lagi atau tanyakan hal lain yang bisa saya bantu.`;
        }
      }
    } else {
      // No API key or empty prompt
      responseText = `Sistem AI sedang dalam mode terbatas. Silakan coba lagi nanti atau hubungi administrator.`;
    }

    return NextResponse.json({
      text: responseText,
      suggestions,
      actions
    });
    
  } catch (error) {
    console.error('AI API error:', error);
    
    return NextResponse.json({
      text: "Terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.",
      suggestions: [],
      actions: []
    });
  }
}