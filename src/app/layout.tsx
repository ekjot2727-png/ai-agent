import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoOps AI - Intelligent Agent System',
  description: 'Goal-driven AI agent that breaks down tasks, executes workflows, and learns from results.',
  keywords: ['AI', 'Agent', 'Automation', 'Workflow', 'Kestra'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🤖</span>
                  <div>
                    <h1 className="text-xl font-bold gradient-text">AutoOps AI</h1>
                    <p className="text-xs text-gray-500">Intelligent Agent System</p>
                  </div>
                </div>
                <nav className="flex items-center gap-4">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span className="text-xl">📚</span>
                    <span className="ml-1 text-sm hidden sm:inline">Docs</span>
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <p>© 2024 AutoOps AI - Built for Hackathon</p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span>⚡</span> Powered by Next.js
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🔄</span> Kestra Workflows
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
