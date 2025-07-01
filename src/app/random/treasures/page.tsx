
"use client";

import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices } from "lucide-react";

export default function TreasuresPage() {
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 md:p-8">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
            <CardContent className="text-center pt-6">
                <Dices className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-2xl">Treasures</CardTitle>
                <p className="text-lg text-muted-foreground mt-2">This page is under construction.</p>
            </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
