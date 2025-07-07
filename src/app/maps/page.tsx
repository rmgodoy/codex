
"use client";

import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapsPage() {

  return (
    <MainLayout showSidebarTrigger={false}>
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-xl text-center">
            <CardHeader>
                <CardTitle>Maps Page Under Construction</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The hex grid library was causing application errors and has been temporarily disabled. We can explore a more stable solution for this page later.</p>
            </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
