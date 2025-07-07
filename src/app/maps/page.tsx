
"use client";

import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";

export default function MapsPage() {
    return (
        <MainLayout showSidebarTrigger={false}>
            <div className="w-full h-full bg-background">
                <HexGrid gridRadius={20} hexSize={25} className="w-full h-full" />
            </div>
        </MainLayout>
    );
}
