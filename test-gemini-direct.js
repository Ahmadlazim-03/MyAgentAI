const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBrfkNWuQFMuG51mZBTslCX6TEylXoIdVo');

async function testGeminiModels() {
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest'
    ];

    console.log('🧪 TESTING GEMINI API MODELS DIRECTLY\n');

    for (const modelName of models) {
        try {
            console.log(`🔥 Testing model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const prompt = "Katakan halo dalam bahasa Indonesia";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ SUCCESS: ${text.substring(0, 100)}...`);
            console.log(`📝 Full response length: ${text.length} chars\n`);
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
            console.log(`🔍 Error details:`, error.status || error.code || 'No additional info');
            console.log('');
        }
    }
}

testGeminiModels();