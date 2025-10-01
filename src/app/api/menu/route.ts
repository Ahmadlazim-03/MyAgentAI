import { NextResponse } from 'next/server';
// import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST() {
  try {
    // Return static menu for now to avoid model issues
    const menuItems = [
      { name: "AI Dashboard", href: "/dashboard", description: "AI-powered control center", icon: "brain" },
      { name: "AI Chat", href: "/chat", description: "Conversation with AI", icon: "message-circle" },
      { name: "Content Creator", href: "/create", description: "AI content generation", icon: "wand" },
      { name: "Analytics", href: "/analytics", description: "AI insights and analysis", icon: "bar-chart" },
      { name: "AI Explorer", href: "/explore", description: "Discover AI capabilities", icon: "search" },
      { name: "Smart Settings", href: "/settings", description: "AI-optimized preferences", icon: "settings" }
    ];
    
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Menu generation error:', error);
    return NextResponse.json([
      { name: "AI Dashboard", href: "/dashboard", description: "AI-powered control center", icon: "brain" },
      { name: "AI Chat", href: "/chat", description: "Conversation with AI", icon: "message-circle" },
      { name: "Content Creator", href: "/create", description: "AI content generation", icon: "wand" },
      { name: "Analytics", href: "/analytics", description: "AI insights and analysis", icon: "bar-chart" }
    ]);
  }
}