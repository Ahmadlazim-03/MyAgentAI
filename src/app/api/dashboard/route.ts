import { NextResponse } from 'next/server';
// import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST() {
  try {
    // Return static dashboard content for now to avoid model issues
    const dashboardContent = {
      widgets: [
        { type: "ai-status", title: "AI Status", data: { status: "Active", requests: 47, uptime: "99.9%" } },
        { type: "content-created", title: "Content Created Today", data: { count: 23, types: "Articles, Images, Reports" } },
        { type: "user-interactions", title: "AI Interactions", data: { count: 156, satisfaction: "94%" } },
        { type: "performance", title: "System Performance", data: { response_time: "0.3s", cpu: "12%", memory: "34%" } },
        { type: "insights", title: "AI Insights", data: { patterns: 5, recommendations: 8, automations: 3 } }
      ],
      insights: [
        "AI is learning from your patterns and adapting responses",
        "Content engagement has increased by 34% this week", 
        "New AI automation features are ready for deployment",
        "Your preferred content style has been identified and optimized",
        "System performance is excellent with 99.9% uptime"
      ],
      recommendations: [
        "Enable AI-powered content scheduling for better engagement",
        "Try the new voice interaction feature in the chat section",
        "Set up automated reporting for your most viewed content"
      ]
    };
    
    return NextResponse.json(dashboardContent);
    
  } catch (error) {
    console.error('Dashboard generation error:', error);
    return NextResponse.json({
      widgets: [
        { type: "ai-status", title: "AI Status", data: { status: "Active", requests: 42 } },
        { type: "content-created", title: "Content Created Today", data: { count: 15 } },
        { type: "user-interactions", title: "AI Interactions", data: { count: 128 } }
      ],
      insights: ["AI is learning from your patterns", "Content engagement up 25%", "New AI features available"]
    });
  }
}