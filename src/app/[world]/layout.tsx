"use client";

import WorldProvider from '@/components/world-provider';
import { useParams } from 'next/navigation';

export default function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const worldSlug = Array.isArray(params.world) ? params.world[0] : params.world;
  
  return <WorldProvider worldSlug={worldSlug}>{children}</WorldProvider>;
}
