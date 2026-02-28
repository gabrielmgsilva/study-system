'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default function ExamFeedbackPage() {
  const [examType, setExamType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [comments, setComments] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend =
    examType.trim().length > 0 &&
    difficulty.trim().length > 0 &&
    comments.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || sending) return;

    setSending(true);
    setSent(false);

    // UI only — simulate submit
    await new Promise((r) => setTimeout(r, 700));

    setSending(false);
    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b1220] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.landing}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>

          <div className="text-right">
            <div className="text-sm font-semibold text-white">
              How was your last exam?
            </div>
            <div className="text-xs text-white/60">
              This page does not use credits.
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                How was your last exam?
              </h1>
              <p className="text-sm text-white/70">
                Your feedback helps improve AME ONE and keeps the question bank
                aligned with real Transport Canada exams.
              </p>
            </div>
          </div>
        </div>

        {/* Why feedback matters */}
        <Card className="rounded-[28px] border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Why we ask this</CardTitle>
            <CardDescription className="text-white/65">
              Short, honest feedback makes a big difference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-white/80 space-y-2">
              <li>• Identify which topics appear more frequently</li>
              <li>• Adjust difficulty and focus of study modules</li>
              <li>• Detect gaps between study material and real exams</li>
            </ul>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/80">
                Your answers are anonymous and used only for educational
                improvement.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feedback form */}
        <Card className="rounded-[28px] border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Exam feedback</CardTitle>
            <CardDescription className="text-white/65">
              Takes less than one minute.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Exam type */}
              <div className="space-y-1">
                <div className="text-xs text-white/70">
                  Which exam did you take?
                </div>
                <Input
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  placeholder="e.g., CARs, Airframe, Powerplant (M1/M2)"
                  className="bg-white/10 border-white/15 text-white placeholder:text-white/45"
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <div className="text-xs text-white/70">
                  Overall difficulty (your perception)
                </div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-md bg-white/10 border border-white/15 text-white p-2 text-sm outline-none"
                >
                  <option value="" className="bg-[#0b1220]">
                    Select one
                  </option>
                  <option value="Easy" className="bg-[#0b1220]">
                    Easy
                  </option>
                  <option value="Medium" className="bg-[#0b1220]">
                    Medium
                  </option>
                  <option value="Hard" className="bg-[#0b1220]">
                    Hard
                  </option>
                  <option value="Very hard" className="bg-[#0b1220]">
                    Very hard
                  </option>
                </select>
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <div className="text-xs text-white/70">
                  Comments (topics, surprises, tips)
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="What topics appeared the most? Anything unexpected?"
                  className="w-full min-h-[120px] rounded-md bg-white/10 border border-white/15 text-white placeholder:text-white/45 p-3 text-sm outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-white/60">
                  This form does not use credits.
                </div>

                <Button type="submit" disabled={!canSend || sending}>
                  {sending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>

              {sent && (
                <div className="rounded-[18px] border border-emerald-200/20 bg-emerald-200/10 p-3 text-sm text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white/80" />
                  Thank you! Your feedback has been recorded (simulation).
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="rounded-[28px] border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Important note
            </CardTitle>
            <CardDescription className="text-white/65">Please read.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[22px] border border-amber-200/20 bg-amber-200/10 p-4">
              <p className="text-sm text-white/85">
                This page is not affiliated with Transport Canada. Feedback is
                voluntary and used only to improve study material and user
                experience.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.appHub}>Go to Study</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.instructions}>App Instructions</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
