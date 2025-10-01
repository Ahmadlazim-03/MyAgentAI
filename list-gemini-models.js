const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBrfkNWuQFMuG51mZBTslCX6TEylXoIdVo');

async function listAvailableModels() {
    try {
        console.log('🔍 LISTING AVAILABLE GEMINI MODELS\n');
        
        const models = await genAI.listModels();
        
        console.log(`📋 Found ${models.length} available models:\n`);
        
        models.forEach((model, index) => {
            console.log(`${index + 1}. ${model.name}`);
            console.log(`   📝 Display Name: ${model.displayName}`);
            console.log(`   📄 Description: ${model.description}`);
            console.log(`   🔧 Supported Generation Methods: ${model.supportedGenerationMethods?.join(', ') || 'Not specified'}`);
            console.log('');
        });
        
        // Test the first available model
        if (models.length > 0) {
            console.log('🧪 TESTING FIRST AVAILABLE MODEL\n');
            const firstModel = models[0];
            const modelName = firstModel.name.replace('models/', '');
            
            console.log(`🔥 Testing model: ${modelName}`);
            
            if (firstModel.supportedGenerationMethods?.includes('generateContent')) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const prompt = "Katakan halo dalam bahasa Indonesia";
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    
                    console.log(`✅ SUCCESS: ${text}`);
                    console.log(`📝 Response length: ${text.length} chars`);
                } catch (error) {
                    console.log(`❌ FAILED: ${error.message}`);
                }
            } else {
                console.log(`⚠️ Model ${modelName} does not support generateContent`);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to list models:', error.message);
    }
}

listAvailableModels();