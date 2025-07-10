
"use client";

import { useState, useEffect } from 'react';
import MainLayout from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookCopy, Calendar, Dices, FlaskConical, Map, Shield, Skull, Sword, Swords, User, Users, Warehouse, Gem } from "lucide-react";
import Link from "next/link";
import { getDb, WORLDS_METADATA_STORE_NAME } from '@/lib/idb/db';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useWorld } from './world-provider';

interface WorldMetadata {
  slug: string;
  name: string;
  description: string;
}

const getMetadataDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("TresspasserWorldsMetadata", 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(WORLDS_METADATA_STORE_NAME)) {
                db.createObjectStore(WORLDS_METADATA_STORE_NAME, { keyPath: 'slug' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export default function WorldLandingPage() {
  const { worldSlug, worldName: contextWorldName, refreshWorldName } = useWorld();
  const [metadata, setMetadata] = useState<WorldMetadata | null>(null);
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!worldSlug) return;
      try {
        const db = await getMetadataDb();
        const store = db.transaction(WORLDS_METADATA_STORE_NAME, 'readonly').objectStore(WORLDS_METADATA_STORE_NAME);
        const request = store.get(worldSlug);
        
        request.onsuccess = () => {
          if (request.result) {
            setMetadata(request.result);
            setWorldName(request.result.name);
            setWorldDescription(request.result.description);
          } else {
            const defaultMetadata: WorldMetadata = { slug: worldSlug, name: contextWorldName, description: 'A new world of adventure awaits...' };
            setMetadata(defaultMetadata);
            setWorldName(defaultMetadata.name);
            setWorldDescription(defaultMetadata.description);
          }
        };
        request.onerror = () => {
          console.error("Error fetching world metadata:", request.error);
        };
      } catch (error) {
        console.error("DB error:", error);
      }
    };
    
    fetchMetadata();
  }, [worldSlug, contextWorldName]);

  const handleSave = async () => {
    if (!worldSlug) return;
    try {
      const db = await getMetadataDb();
      const tx = db.transaction(WORLDS_METADATA_STORE_NAME, 'readwrite');
      const store = tx.objectStore(WORLDS_METADATA_STORE_NAME);
      const updatedMetadata: WorldMetadata = { slug: worldSlug, name: worldName, description: worldDescription };
      store.put(updatedMetadata);
      
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      
      setMetadata(updatedMetadata);
      setIsEditing(false);
      refreshWorldName();
      toast({ title: 'World Updated', description: 'Your world details have been saved.' });
    } catch(e) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to save world details.' });
    }
  };

  const features = [
    { title: "Alchemy", description: "Manage potions, powders, oils, and bombs.", icon: FlaskConical, href: `/#/${worldSlug}/alchemy` },
    { title: "Bestiary", description: "Create, edit, and manage all the creatures for your game.", icon: Skull, href: `/#/${worldSlug}/bestiary` },
    { title: "Deeds Library", description: "A library of actions that creatures can perform.", icon: BookCopy, href: `/#/${worldSlug}/deeds` },
    { title: "Encounters", description: "Design and run combat encounters.", icon: Swords, href: `/#/${worldSlug}/encounters` },
    { title: "Items", description: "Catalog weapons, armor, and other equipment.", icon: Sword, href: `/#/${worldSlug}/items` },
    { title: "NPCs", description: "Create detailed Non-Player Characters.", icon: User, href: `/#/${worldSlug}/npcs` },
    { title: "Factions", description: "Manage the various factions in your world.", icon: Users, href: `/#/${worldSlug}/factions` },
    { title: "Pantheon", description: "Manage the godlike entities of your world.", icon: Shield, href: `/#/${worldSlug}/pantheon` },
    { title: "Rooms", description: "Build a library of reusable rooms for dungeons.", icon: Warehouse, href: `/#/${worldSlug}/rooms` },
    { title: "Treasures", description: "Create a library of treasure items.", icon: Gem, href: `/#/${worldSlug}/random/treasures` },
    { title: "Encounter Tables", description: "Create weighted tables to randomly generate encounters.", icon: Dices, href: `/#/${worldSlug}/random/encounter-tables` },
    { title: "Commoners", description: "Instantly generate four random commoner PCs.", icon: Dices, href: `/#/${worldSlug}/random/commoners` },
    { title: "Dungeons", description: "Assemble your pre-defined rooms into complex dungeons.", icon: Dices, href: `/#/${worldSlug}/dungeons` },
    { title: "World Map", description: "A powerful hex-grid map creator.", icon: Map, href: `/#/${worldSlug}/maps` },
    { title: "Calendar", description: "A fully-featured in-game calendar.", icon: Calendar, href: `/#/${worldSlug}/calendar` },
  ].sort((a,b) => a.title.localeCompare(b.title));

  return (
    <MainLayout>
      <div className="h-full overflow-y-auto bg-background/50">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
             {isEditing ? (
              <div className="max-w-xl mx-auto space-y-4">
                <Input
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl text-center h-auto bg-transparent border-primary"
                />
                <Textarea
                  value={worldDescription}
                  onChange={(e) => setWorldDescription(e.target.value)}
                  className="mt-3 text-lg text-muted-foreground sm:text-xl md:mt-5 bg-transparent"
                  rows={3}
                />
                <div className="flex justify-center gap-2 mt-4">
                    <Button onClick={handleSave}>Save</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
                  {metadata?.name || contextWorldName || 'Loading...'}
                </h1>
                <p className="mt-3 max-w-md mx-auto text-lg text-muted-foreground sm:text-xl md:mt-5 md:max-w-3xl">
                  {metadata?.description || '...'}
                </p>
                <div className="mt-5">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit World Details</Button>
                </div>
              </>
            )}
          </div>

          <div className="mt-20">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <feature.icon className="h-8 w-8 text-accent" />
                      <CardTitle>{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                  <CardContent>
                    <a href={feature.href}>
                      <Button variant="outline" className="w-full">
                        Go to {feature.title}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
