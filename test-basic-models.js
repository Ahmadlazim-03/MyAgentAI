const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBrfkNWuQFMuG51mZBTslCX6TEylXoIdVo');

async function testBasicModels() {
    // Try some older, more stable model names
    const basicModels = [
        'gemini-pro',
        'text-bison-001',
        'text-bison',
        'chat-bison-001',
        'chat-bison',
        'gemini-1.0-pro',
        'models/gemini-pro',
        'models/gemini-1.0-pro'
    ];

    console.log('🧪 TESTING BASIC GEMINI MODELS\n');

    for (const modelName of basicModels) {
        try {
            console.log(`🔥 Testing model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const prompt = "Hello, say hi in Indonesian";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ SUCCESS: ${text.substring(0, 100)}...`);
            console.log(`📝 Response length: ${text.length} chars`);
            console.log(`🎯 WORKING MODEL FOUND: ${modelName}\n`);
            
            // If we found a working model, break here
            return modelName;
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.message.substring(0, 100)}...`);
            console.log('');
        }
    }
    
    console.log('😞 No working models found');
    return null;
}

testBasicModels().then(workingModel => {
    if (workingModel) {
        console.log(`\n🎉 RECOMMENDATION: Use model "${workingModel}" in your route.ts`);
    }
});