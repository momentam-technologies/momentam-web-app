import { ModeToggle } from "@/components/theme";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { BookCopy, User2, Camera, DollarSign } from "lucide-react"

export default async function Page() {

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            {/* Topbar inside content area (excluding sidebar) */}
            <div className="flex justify-between mr-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                <p className="ml-4 text-2xl font-semibold">Welcome Admin Momentam</p>
                <ModeToggle />
            </div>

            {/* Main grid content, placed below toggle */}
            <main className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white dark:bg-sky-600">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-lg">
                                <User2 className="w-5 h-5" />
                                Total Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl"></p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-sky-600">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-lg">
                                <Camera className="w-5 h-5" />
                                Total Photographers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl"></p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-sky-600">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-lg">
                                <BookCopy className="w-5 h-5" />
                                Total Bookings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl"></p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-sky-600">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-lg">
                                <DollarSign className="w-5 h-5" />
                                Total  Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl"></p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}