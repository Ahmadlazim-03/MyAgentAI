'use client';

import { AIChat } from '@/components/ai-chat-clean';
import { AIProvider } from '@/contexts/ai-context';
import { ThemeProvider } from '@/contexts/theme-context';

export default function Home() {
  return (
    <AIProvider>
      <ThemeProvider>
        <AIChat />
      </ThemeProvider>
    </AIProvider>
  );
}
