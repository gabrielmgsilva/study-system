import React from 'react';
import { headers } from 'next/headers';

type Q = {
  qid: string;
  examCode?: string;
  topicCode?: string;
  topicTitle?: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  reference?: string;
  explanation?: string;
  source?: string;
  category?: string;
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get('host') || 'localhost:3000';

  // Em dev é http, em produção normalmente https
  const proto =
    process.env.NODE_ENV === 'development' ? 'http' : 'https';

  return `${proto}://${host}`;
}

async function getQuestion(id: string): Promise<Q | null> {
  const baseUrl = await getBaseUrl();

  const res = await fetch(
    `${baseUrl}/api/question-by-id?id=${encodeURIComponent(id)}`,
    { cache: 'no-store' }
  );

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  return data?.ok ? (data.question as Q) : null;
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const q = await getQuestion(id);

  if (!q) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold">Questão não encontrada</h1>
          <p className="mt-2 text-muted-foreground">
            ID: <span className="font-mono">{id}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{q.qid}</span>
            {q.examCode ? <span>• {q.examCode}</span> : null}
            {q.topicCode ? <span>• {q.topicCode}</span> : null}
          </div>

          {q.topicTitle ? (
            <div className="text-sm text-muted-foreground">{q.topicTitle}</div>
          ) : null}

          <h2 className="text-lg font-semibold">{q.question}</h2>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <p className="font-semibold mb-1">Correct answer</p>
            <p>
              {q.correctAnswer}. {q.options[q.correctAnswer]}
            </p>
          </div>

          {q.explanation ? (
            <div className="p-3 rounded-lg bg-muted/60 text-sm">
              <p className="font-semibold mb-1">Explanation</p>
              <p>{q.explanation}</p>
            </div>
          ) : null}

          <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
            {q.reference ? (
              <p>
                <span className="font-semibold">Reference: </span>
                {q.reference}
              </p>
            ) : null}
            {q.source ? (
              <p>
                <span className="font-semibold">Source: </span>
                {q.source}
              </p>
            ) : null}
            {q.category ? (
              <p>
                <span className="font-semibold">Category: </span>
                {q.category}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
