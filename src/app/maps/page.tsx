
"use client";

import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function MapsPage() {
    return (
        <MainLayout showSidebarTrigger={false}>
            <div className="w-full h-full bg-background relative">
                <HexGrid gridRadius={20} hexSize={25} className="w-full h-full" />

                <Card className="fixed top-20 left-4 z-10 w-64 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Construction className="h-5 w-5" />
                            Map Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">This panel is under construction.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
