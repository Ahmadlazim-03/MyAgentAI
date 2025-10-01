// Test script untuk verifikasi markdown formatting
const http = require('http');
const querystring = require('querystring');

async function testMarkdownFormatting() {
    console.log('🎨 TESTING MARKDOWN FORMATTING\n');
    
    const testPrompts = [
        {
            name: "Lists and Headers",
            prompt: "Buatkan tutorial singkat dengan format:\n\n# Judul Utama\n## Sub Judul\n\n1. Item pertama\n2. Item kedua\n   - Sub item\n   - Sub item lagi\n\n**Bold text** dan *italic text*"
        },
        {
            name: "Code Blocks",
            prompt: "Buatkan contoh kode HTML sederhana dengan penjelasan yang menggunakan format markdown"
        },
        {
            name: "Mixed Content",
            prompt: "Jelaskan tentang database dengan format yang rapi termasuk:\n\n### Apa itu Database?\n\nPenjelasan dengan **kata penting** dan:\n\n1. Keuntungan\n2. Kerugian\n\n```sql\nCREATE TABLE users (id INT PRIMARY KEY);\n```"
        }
    ];
    
    for (const test of testPrompts) {
        try {
            console.log(`📋 Testing: ${test.name}`);
            console.log(`📤 Prompt: ${test.prompt.substring(0, 100)}...`);
            
            const postData = JSON.stringify({
                prompt: test.prompt
            });
            
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/ai',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const response = await new Promise((resolve, reject) => {
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, data }));
                });
                
                req.on('error', reject);
                req.write(postData);
                req.end();
            });
            
            console.log(`✅ Status: ${response.status}`);
            
            if (response.status === 200) {
                const result = JSON.parse(response.data);
                console.log(`📄 Response length: ${result.text.length} chars`);
                
                // Check for markdown elements
                const hasHeaders = /#{1,6}\s/.test(result.text);
                const hasBold = /\*\*(.*?)\*\*/.test(result.text);
                const hasLists = /^\d+\.\s|^[-*]\s/m.test(result.text);
                const hasCodeBlocks = /```/.test(result.text);
                
                console.log(`🎯 Markdown Elements Found:`);
                console.log(`   Headers: ${hasHeaders ? '✅' : '❌'}`);
                console.log(`   Bold: ${hasBold ? '✅' : '❌'}`);
                console.log(`   Lists: ${hasLists ? '✅' : '❌'}`);
                console.log(`   Code Blocks: ${hasCodeBlocks ? '✅' : '❌'}`);
                
                console.log(`📝 Preview: ${result.text.substring(0, 200)}...`);
            } else {
                console.log(`❌ Request failed`);
            }
            
            console.log('────────────────────────────────────────');
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log('────────────────────────────────────────');
        }
    }
    
    console.log('\n🎉 Markdown formatting test completed!');
    console.log('Now check the browser at http://localhost:3000 to see visual formatting!');
}

testMarkdownFormatting();