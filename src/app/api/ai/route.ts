import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllKeys } from '@/lib/key-manager';

export const maxRequestBodySize = '4mb';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize GenAI with proper error handling
function getGenAIClients(): GoogleGenerativeAI[] {
  const keys = getAllKeys(true);
  const clients: GoogleGenerativeAI[] = [];
  for (const k of keys) {
    try {
      clients.push(new GoogleGenerativeAI(k));
    } catch {}
  }
  if (clients.length === 0) {
    console.warn('No Gemini API keys available (env or stored).');
  }
  return clients;
}

export async function POST(request: Request) {
  try {
    let prompt = "";
    let context = null;
  let imageData: string | string[] | null = null;
    
    // Safely parse JSON with error handling
    try {
      const body = await request.json();
  console.log('[AI API] Body received:', { prompt: body?.prompt, context: body?.context, images: Array.isArray(body?.imageData) ? body?.imageData.length : (body?.imageData ? 1 : 0) });
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
    // No-op: image parts constructed later when needed

    // PRIORITY 1: Try to use Gemini AI for ALL requests
    const clients = getGenAIClients();
    if (clients.length > 0 && (prompt.trim() || imageData)) {
      try {
        console.log('[AI API] Attempting Gemini AI response...');
        
        // Try multiple models for better success rate
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];
        let success = false;
        
        for (const client of clients) {
          for (const modelName of models) {
            try {
              const model = client.getGenerativeModel({ model: modelName });
            
            // Create intelligent prompt based on request type
            const ctx = context as unknown as { userHistory?: string[] } | null;
            const historyText = Array.isArray(ctx?.userHistory) && ctx?.userHistory.length
              ? `\n\nRingkasan percakapan sebelumnya (ringkas):\n${(ctx!.userHistory!).slice(-8).join('\n')}`
              : '';
            const currentRequest = prompt.trim() || 'Tolong analisis gambar yang saya lampirkan.';
            const enhancedPrompt = `Anda adalah AI assistant yang sangat membantu dan expert dalam berbagai bidang.${historyText}\n\nPermintaan user sekarang: "${currentRequest}"

Instruksi:
- Jika diminta membuat kode, berikan kode yang lengkap, fungsional, dan siap dijalankan
- Jika diminta puisi, buatlah puisi yang indah dan bermakna
- Jika diminta membuka website, berikan response singkat dan action redirect
- Jika diminta informasi, berikan jawaban yang akurat dan helpful
- Jika ada gambar terlampir, lakukan analisis pada gambar tersebut secara jelas dan terstruktur
- Selalu gunakan bahasa Indonesia yang natural
- Berikan response yang sesuai dengan permintaan user

Response harus dalam format yang rapi dan mudah dibaca.`;

            // If image is attached, use multimodal input
            let result;
            if (imageData) {
              // Normalize to array and build multiple inline parts
              const imgs = Array.isArray(imageData) ? imageData : [imageData];
              const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
                { text: enhancedPrompt }
              ];
              for (const img of imgs) {
                const base64Data = img;
                const dataOnly = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data;
                const mime = base64Data.startsWith('data:') && base64Data.includes(';')
                  ? base64Data.substring(base64Data.indexOf(':') + 1, base64Data.indexOf(';'))
                  : 'image/png';
                parts.push({ inlineData: { data: dataOnly, mimeType: mime } });
              }
              console.log('[AI API] Received images for analysis:', { count: imgs.length });
              type GenPart = { text: string } | { inlineData: { data: string; mimeType: string } };
              type GenerateRequest = { contents: Array<{ role: string; parts: GenPart[] }> };
              const request: GenerateRequest = {
                contents: [
                  {
                    role: 'user',
                    parts
                  }
                ]
              };
              interface GenModel { generateContent(input: GenerateRequest | string): Promise<{ response: { text(): string } }> }
              const gModel = model as unknown as GenModel;
              result = await gModel.generateContent(request);
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
          if (success) break;
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
      // No API key(s) configured or empty input without image
      const hasInput = prompt.trim() || imageData;
      if (!hasInput) {
        responseText = 'Masukkan pertanyaan atau lampirkan gambar untuk dianalisis.';
      } else {
        responseText = `Tidak ada API Key Gemini yang terkonfigurasi.

Silakan lakukan salah satu:
1) Buka halaman Settings di /settings lalu tambahkan API Key baru
2) Atau set GEMINI_API_KEY di file .env.local lalu restart server pengembangan

Setelah kunci tersedia, saya akan memproses permintaan Anda secara otomatis.`;
      }
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