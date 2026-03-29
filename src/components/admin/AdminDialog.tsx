'use client';

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';

type AdminDialogSize =
  | 'compact'
  | 'narrow'
  | 'form'
  | 'formWide'
  | 'formWider'
  | 'wide'
  | 'content'
  | 'questions';

type AdminDialogHeight = 'default' | 'tall';

const sizeClasses: Record<AdminDialogSize, string> = {
  compact: 'max-w-lg',
  narrow: 'max-w-xl',
  form: 'sm:max-w-[560px]',
  formWide: 'sm:max-w-[620px]',
  formWider: 'sm:max-w-[720px]',
  wide: 'max-w-3xl',
  content: 'max-w-5xl',
  questions: 'max-w-6xl',
};

const heightClasses: Record<AdminDialogHeight, string> = {
  default: 'max-h-[90vh]',
  tall: 'max-h-[92vh]',
};

type AdminDialogContentProps = ComponentProps<typeof DialogContent> & {
  size?: AdminDialogSize;
  height?: AdminDialogHeight;
};

export function AdminDialogContent({
  className,
  size = 'wide',
  height = 'default',
  ...props
}: AdminDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        'grid w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border-slate-200 bg-white p-0',
        sizeClasses[size],
        heightClasses[height],
        className,
      )}
      {...props}
    />
  );
}

export function AdminDialogHeader({ className, ...props }: ComponentProps<typeof DialogHeader>) {
  return <DialogHeader className={cn('border-b border-slate-200 px-6 py-5', className)} {...props} />;
}

export function AdminDialogBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 overflow-y-auto px-6 py-5', className)} {...props} />;
}

export function AdminDialogFooter({ className, ...props }: ComponentProps<typeof DialogFooter>) {
  return <DialogFooter className={cn('border-t border-slate-200 px-6 py-4 sm:justify-end', className)} {...props} />;
}