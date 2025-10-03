import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';

// Format message with markdown
export const formatMessage = (content: string): React.ReactNode => {
  const components = {
    code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const isInline = !className;
      if (!isInline) {
        return (
          <div className="code-block-container">
            <div className="code-block-header">
              <span className="code-language-label">{language}</span>
              <button
                onClick={() => navigator.clipboard.writeText(String(children))}
                className="code-copy-button"
                title="Copy code"
              >
                <Copy className="h-3 w-3 mr-1.5 inline" />
                Copy
              </button>
            </div>
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{ margin: 0, fontSize: '14px', background: 'transparent' }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <code className="inline-code" {...props}>
          {children}
        </code>
      );
    },
    // Table components
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-gray-50">
        {children}
      </thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody className="bg-white divide-y divide-gray-200">
        {children}
      </tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr className="hover:bg-gray-50">
        {children}
      </tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0">
        {children}
      </td>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 leading-relaxed text-gray-700 whitespace-pre-wrap">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 ml-6 space-y-2 list-disc">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-4 ml-6 space-y-2 list-decimal">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed text-gray-700 mb-1">{children}</li>
    ),
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900">{children}</h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-base font-bold mb-2 mt-3 text-gray-900">{children}</h4>
    ),
    h5: ({ children }: { children?: React.ReactNode }) => (
      <h5 className="text-sm font-bold mb-2 mt-3 text-gray-900">{children}</h5>
    ),
    h6: ({ children }: { children?: React.ReactNode }) => (
      <h6 className="text-sm font-bold mb-2 mt-3 text-gray-700">{children}</h6>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-gray-700">{children}</em>
    ),
    hr: () => (
      <hr className="my-6 border-t border-gray-300" />
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="pl-4 my-4 italic py-3 rounded-r border-l-4 border-blue-400 bg-blue-50 text-gray-700">
        {children}
      </blockquote>
    ),
  } as unknown as import('react-markdown').Components;
  
  return (
    <div className="markdown-content space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Extract links from content
export const extractLinksFromContent = (content: string): { label: string; href: string }[] => {
  const links: { label: string; href: string }[] = [];
  
  // Regex untuk mendeteksi links dalam format yang berbeda
  const patterns = [
    // Format: Label: https://example.com (dengan spasi atau tanpa spasi)
    /([A-Za-z][A-Za-z0-9\s]*[A-Za-z0-9])\s*:\s*(https?:\/\/[^\s\n]+)/g,
    // Format: **Label**: https://example.com
    /\*\*([^*]+)\*\*\s*:\s*(https?:\/\/[^\s\n]+)/g,
    // Format: [Label](https://example.com)
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  ];
  
  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      const label = match[1].trim();
      const href = match[2].trim();
      
      // Cek apakah link sudah ada
      if (!links.some(link => link.href === href)) {
        links.push({ label, href });
      }
    }
  });
  
  return links;
};

// Function untuk mendapatkan favicon URL
export const getFaviconUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '/favicon.ico'; // fallback
  }
};