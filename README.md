
# Codex

This is a comprehensive application for managing and organizing your TTRPG world, specifically designed for the Tresspasser system. It allows you to create creatures, design encounters, build dungeons, track events on a calendar, and visualize your world on a hex map.

## Features

This application is divided into several powerful modules to help you manage every aspect of your game world.

### Compendium Modules

These modules form the core library of your world's assets.

*   **Bestiary**: The heart of the application. Create, edit, and manage all the creatures for your game. Define their stats, roles, templates, abilities, and link them to deeds from your library.
*   **Deeds**: A library of actions. Create and manage reusable "deeds" that creatures can perform, from simple attacks to complex magical spells.
*   **Items**: Catalog all your world's items, including weapons, armor, shields, and tools. Define their properties, prices, and magical enchantments.
*   **Alchemy**: Keep track of potions, powders, oils, and bombs. Define their alchemical properties, tiers, and effects.
*   **Rooms**: Build a library of reusable rooms, complete with descriptions and features like encounters or treasures.
*   **Dungeons**: Assemble your pre-defined rooms into complex, interconnected dungeons.
*   **NPCs**: Create detailed Non-Player Characters with backstories, personalities, motivations, and relationships with other NPCs and factions.
*   **Factions**: Manage the various factions in your world, defining their goals and descriptions.

### World Management Modules

These modules help you bring your world to life.

*   **Encounters**: Design and run combat encounters. Add players and select monsters from your bestiary or from random encounter tables. The live encounter view includes an initiative tracker and a dashboard to manage combatant stats and states.
*   **Calendar**: A fully-featured in-game calendar. Create multiple calendars, add events with specific dates, and link them to factions, creatures, NPCs, and even specific locations on your world map.
*   **Maps**: A powerful hex-grid map creator. Paint terrain, add icons for landmarks, and link map tiles to your dungeons, factions, and calendar events to create a deeply interconnected world.

### Random Generators

Need some quick inspiration? Use the random generators.

*   **Encounter Tables**: Create weighted tables to randomly generate encounters based on a Threat Rating.
*   **Treasures**: Create a library of treasure items with varying materials, gemstones, and values. You can also randomly generate new treasures.
*   **Commoners**: Instantly generate four random commoner PCs for their first day of adventuring, complete with unique past lives, attributes, skills, and equipment.

## Getting Started

1.  **Explore the Compendium**: Start by adding a few creatures in the **Bestiary** and some actions in the **Deeds** library.
2.  **Build an Encounter**: Navigate to the **Encounters** page and create a new encounter. Add some players and monsters from your bestiary. Click "Run Encounter" to see the live combat tracker in action.
3.  **Create a Map**: Go to the **Maps** page, create a new map, and start painting your world.
4.  **Add an Event**: Open the **Calendar**, add an event, and use the location picker to place it on the map you just created.

## To-Do / In Progress

Here is a list of features and fixes currently planned for future updates:

*   Revisit the "Random Encounter Table" feature; consider refactoring it into a more generic "Random Creature Table".
*   Allow creating Deeds directly from the NPC editor.
*   Update the dataset to include all official deeds for creatures from the Tresspasser rulebook.

## Import & Export

Your data is yours. You can export your entire world bible to a single JSON file for backup or sharing. Use the **Upload** and **Download** icons in the top-right corner of the application header. This allows you to easily move your data between devices or collaborate with others.
