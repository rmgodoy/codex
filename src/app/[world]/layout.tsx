
"use client";

import WorldProvider from '@/components/world-provider';

export default function WorldLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { world: string };
}) {
  return <WorldProvider worldSlug={params.world}>{children}</WorldProvider>;
}
