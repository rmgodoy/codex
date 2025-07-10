
"use client";

import { useState, useEffect } from 'react';
import MainLayout from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookCopy, Calendar, Dices, FlaskConical, Map, Shield, Skull, Sword, User, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { getDb, WORLDS_METADATA_STORE_NAME, DB_NAME } from '@/lib/idb';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface WorldMetadata {
  name: string;
  description: string;
}

export default function WorldLandingPage({ params }: { params: { world: string } }) {
  const { world: worldSlug } = params;
  const [metadata, setMetadata] = useState<WorldMetadata | null>(null);
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const db = await getDb();
        const store = db.transaction(WORLDS_METADATA_STORE_NAME, 'readonly').objectStore(WORLDS_METADATA_STORE_NAME);
        const request = store.get(worldSlug);
        
        request.onsuccess = () => {
          if (request.result) {
            setMetadata(request.result);
            setWorldName(request.result.name);
            setWorldDescription(request.result.description);
          } else {
             // If no metadata, create it
            const defaultName = worldSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const defaultMetadata: WorldMetadata = { name: defaultName, description: 'A new world of adventure awaits...' };
            const writeTx = db.transaction(WORLDS_METADATA_STORE_NAME, 'readwrite');
            writeTx.objectStore(WORLDS_METADATA_STORE_NAME).put(defaultMetadata, worldSlug);
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
  }, [worldSlug]);

  const handleSave = async () => {
    try {
      const db = await getDb();
      const tx = db.transaction(WORLDS_METADATA_STORE_NAME, 'readwrite');
      const store = tx.objectStore(WORLDS_METADATA_STORE_NAME);
      const updatedMetadata: WorldMetadata = { name: worldName, description: worldDescription };
      store.put(updatedMetadata, worldSlug);
      
      tx.oncomplete = () => {
        setMetadata(updatedMetadata);
        setIsEditing(false);
        toast({ title: 'World Updated', description: 'Your world details have been saved.' });
      };
      tx.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save world details.' });
      }
    } catch(e) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to save world details.' });
    }
  };

  const features = [
    { title: "Bestiary", description: "Create, edit, and manage all the creatures for your game. Define their stats, roles, abilities, and deeds.", icon: Skull, href: `/${worldSlug}/bestiary` },
    { title: "Deeds Library", description: "A library of actions. Create and manage reusable 'deeds' that creatures can perform.", icon: BookCopy, href: `/${worldSlug}/deeds` },
    { title: "Items & Alchemy", description: "Catalog weapons, armor, and alchemical concoctions. Define their properties and enchantments.", icon: FlaskConical, href: `/${worldSlug}/items` },
    { title: "NPCs & Factions", description: "Create detailed Non-Player Characters and manage the various factions in your world.", icon: Users, href: `/${worldSlug}/npcs` },
    { title: "Encounter Builder", description: "Design and run combat encounters with an initiative tracker and a dashboard.", icon: Sword, href: `/${worldSlug}/encounters` },
    { title: "World Map", description: "A powerful hex-grid map creator. Paint terrain, add landmarks, and link map tiles to your content.", icon: Map, href: `/${worldSlug}/maps` },
    { title: "Pantheon", description: "Manage the godlike entities of your world, their domains, relationships, and artifacts.", icon: Shield, href: `/${worldSlug}/pantheon` },
    { title: "Calendar", description: "A fully-featured in-game calendar. Create multiple calendars, add events, and link them to content.", icon: Calendar, href: `/${worldSlug}/calendar` },
    { title: "Random Generators", description: "Instantly generate commoners, encounter tables, and treasures for your world.", icon: Dices, href: `/${worldSlug}/random/commoners` },
  ];

  return (
    <MainLayout pageTitle={metadata?.name} worldSlug={worldSlug}>
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
                  {metadata?.name || 'Loading...'}
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
                    <Link href={feature.href} passHref>
                      <Button variant="outline" className="w-full">
                        Go to {feature.title}
                      </Button>
                    </Link>
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

