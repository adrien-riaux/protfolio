import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ChatMessage } from '../lib/types';

const SUGGESTED_QUESTIONS = [
  'What are your strongest technical skills?',
  'Which projects are you most proud of?',
  'What kind of roles are you targeting?',
  'What certifications do you currently hold?'
];

export default function ChatWidget(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content: string): Promise<void> {
    const cleaned = content.trim();
    if (!cleaned || isLoading) return;

    const nextHistory = [...messages, { role: 'user', content: cleaned } as ChatMessage];
    setMessages([...nextHistory, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory })
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => ({ error: 'Request failed' }))) as {
          error?: string;
        };
        throw new Error(body.error ?? 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([
          ...nextHistory,
          {
            role: 'assistant',
            content: accumulated
          }
        ]);
      }
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Unable to process your request.';
      setMessages([
        ...nextHistory,
        {
          role: 'assistant',
          content: `Error: ${fallbackMessage}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="card-surface p-4 sm:p-6">
      {messages.length === 0 ? (
        <div className="mb-5 grid gap-2 sm:grid-cols-2">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              className="rounded-xl border border-ink/20 bg-sand/80 px-3 py-2 text-left text-sm text-ink transition hover:border-moss hover:text-moss"
              onClick={() => void sendMessage(question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}-${message.content.length}`}
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'ml-auto max-w-[80%] bg-moss text-sand'
                : 'max-w-[86%] border border-ink/15 bg-sand/70 text-ink'
            }`}
          >
            {message.content || (isLoading && index === messages.length - 1 ? 'Thinking...' : '')}
          </article>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="mt-4 flex gap-2" onSubmit={onSubmit}>
        <input
          className="flex-1 rounded-xl border border-ink/20 bg-sand/85 px-3 py-2 text-sm text-ink outline-none transition focus:border-moss"
          placeholder="Ask about projects, skills, achievements..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>

      <p className="mt-3 text-xs text-ink/60">Powered by TogetherAI. Chat is stateless and not stored.</p>
    </section>
  );
}
