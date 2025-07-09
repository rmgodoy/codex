
"use client";

import { useState } from "react";
import MainLayout from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { generateFourCommoners } from "@/lib/commoner-generator";
import type { Commoner } from "@/lib/types";
import CommonerCard from "@/components/commoner-card";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function CommonersPage() {
  const [commoners, setCommoners] = useState<Commoner[]>([]);

  const handleGenerate = () => {
    setCommoners(generateFourCommoners());
  };

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <Button onClick={handleGenerate} size="lg">
                <Dices className="mr-2 h-5 w-5" />
                Generate Commoners
              </Button>
            </div>

            {commoners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {commoners.map((commoner) => (
                  <CommonerCard key={commoner.id} commoner={commoner} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground mt-16">
                <p>Click the button to generate your first set of commoners.</p>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
