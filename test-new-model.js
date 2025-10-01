const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBrfkNWuQFMuG51mZBTslCX6TEylXoIdVo');

async function testNewModel() {
    try {
        console.log('🧪 TESTING NEW GEMINI MODEL\n');
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = "Buatkan saya code HTML sederhana untuk halaman profil";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ SUCCESS with gemini-2.5-flash!');
        console.log(`📝 Response length: ${text.length} chars`);
        console.log('📄 Preview:');
        console.log(text.substring(0, 300) + '...');
        
    } catch (error) {
        console.log('❌ FAILED:', error.message);
    }
}

testNewModel();