'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Coming Soon</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Coming Soon</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Website Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Coming Soon</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Now</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Coming Soon</div>
                    </CardContent>
                </Card>
            </div>
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Feed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Activity feed coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
