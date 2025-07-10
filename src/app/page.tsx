
"use client";

import MainLayout from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCopy, Calendar, Dices, FlaskConical, Map, Shield, Skull, Sword, User, Users, Warehouse } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Bestiary",
    description: "Create, edit, and manage all the creatures for your game. Define their stats, roles, abilities, and deeds.",
    icon: Skull,
    href: "/bestiary"
  },
  {
    title: "Deeds Library",
    description: "A library of actions. Create and manage reusable 'deeds' that creatures can perform, from simple attacks to complex spells.",
    icon: BookCopy,
    href: "/deeds"
  },
  {
    title: "Items & Alchemy",
    description: "Catalog weapons, armor, and alchemical concoctions. Define their properties, prices, and magical enchantments.",
    icon: FlaskConical,
    href: "/items"
  },
  {
    title: "NPCs & Factions",
    description: "Create detailed Non-Player Characters and manage the various factions in your world, defining their goals and relationships.",
    icon: Users,
    href: "/npcs"
  },
  {
    title: "Encounter Builder",
    description: "Design and run combat encounters with an initiative tracker and a dashboard to manage combatant stats and states.",
    icon: Sword,
    href: "/encounters"
  },
  {
    title: "World Map",
    description: "A powerful hex-grid map creator. Paint terrain, add landmarks, and link map tiles to your world's content.",
    icon: Map,
    href: "/maps"
  },
    {
    title: "Pantheon",
    description: "Manage the godlike entities of your world, their domains, relationships, and the artifacts they control.",
    icon: Shield,
    href: "/pantheon"
  },
  {
    title: "Calendar",
    description: "A fully-featured in-game calendar. Create multiple calendars, add events, and link them to factions, creatures, and locations.",
    icon: Calendar,
    href: "/calendar"
  },
    {
    title: "Random Generators",
    description: "Instantly generate commoners, encounter tables, and treasures to bring your world to life on the fly.",
    icon: Dices,
    href: "/random/commoners"
  },
];


export default function LandingPage() {
  return (
    <MainLayout>
        <div className="h-full overflow-y-auto bg-background/50">
            <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
                        Your TTRPG World, Organized
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-lg text-muted-foreground sm:text-xl md:mt-5 md:max-w-3xl">
                        A comprehensive application for managing and organizing your TTRPG world. Create creatures, design encounters, build dungeons, and bring your stories to life.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div className="rounded-md shadow">
                            <Link href="/bestiary">
                                <Button size="lg">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
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
                                <Link href={feature.href}>
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

