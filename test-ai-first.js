// Test the new AI-first system
async function testAIFirstSystem() {
    console.log('🤖 TESTING AI-FIRST SYSTEM\n');
    
    const tests = [
        {
            name: 'Python Programming',
            message: 'buatkan saya code program python sederhana'
        },
        {
            name: 'Creative Writing',
            message: 'buatkan puisi tentang cinta'
        },
        {
            name: 'React Development',
            message: 'buatkan komponen React form login'
        },
        {
            name: 'Database Design',
            message: 'buatkan database schema untuk e-commerce'
        },
        {
            name: 'General Question',
            message: 'bagaimana cara belajar programming yang efektif?'
        },
        {
            name: 'Web Development',
            message: 'buatkan halaman HTML portfolio yang menarik'
        }
    ];
    
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        
        try {
            console.log(`📋 TEST ${i+1}/${tests.length}: ${test.name}`);
            console.log(`📤 Request: "${test.message}"`);
            
            const startTime = Date.now();
            const response = await fetch('http://localhost:3000/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: test.message })
            });
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const result = await response.json();
                
                console.log(`✅ Status: ${response.status} (${responseTime}ms)`);
                console.log(`📄 Length: ${result.text?.length || 0} chars`);
                
                // Check if it's from AI (longer, more detailed) vs hardcode (shorter, template)
                const isAIResponse = result.text?.length > 500;
                const isHardcodedFallback = result.text?.includes('gangguan teknis') || 
                                          result.text?.includes('mode terbatas');
                
                if (isAIResponse && !isHardcodedFallback) {
                    console.log(`🤖 SOURCE: Gemini AI (Dynamic Response)`);
                } else {
                    console.log(`⚠️ SOURCE: Fallback (Hardcoded Response)`);
                }
                
                console.log(`📝 Preview: "${result.text?.substring(0, 150)}..."`);
                
            } else {
                console.log(`❌ HTTP Error: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('─'.repeat(60));
    }
    
    console.log('\n🎯 TEST COMPLETED!');
    console.log('🤖 AI-first system prioritizes Gemini AI over hardcoded responses');
}

testAIFirstSystem();