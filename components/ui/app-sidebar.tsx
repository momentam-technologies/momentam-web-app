import { Home, ChartColumnIncreasing, BookCopy, User2, Album, ChevronUp, BadgeDollarSign, Users, Camera, Settings } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import Image from "next/image"
import { auth } from "@/auth";
import LogoutButton from "../logout";
import Link from "next/link";

// Menu items.
const items = [
    {
        title: "Home",
        url: "/home",
        icon: Home,
    },
    {
        title: "Users",
        url: "/home/users",
        icon: Users,
    },
    {
        title: "Photographers",
        url: "/home/photographers",
        icon: Camera,
    },
    {
        title: "Photos",
        url: "/home/photos",
        icon: Album,
    },
    {
        title: "Bookings",
        url: "/home/bookings",
        icon: BookCopy,
    },
    {
        title: "Finances",
        url: "/home/finances",
        icon: BadgeDollarSign,
    },
    {
        title: "Analytics",
        url: "/home/analytics",
        icon: ChartColumnIncreasing,
    },
    {
        title: "Settings",
        url: "/home/settings",
        icon: Settings
    }
]

export default async function AppSidebar() {

    const session = await auth();

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <Image src="/dashboard.png" width={200} height={200} className="object-cover rounded-full" alt="Dashboard Image" />
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title} className="mt-2">
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full">
                                    <User2 className="mr-2" />
                                    <span>{session?.user.username}</span>
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-full">
                                <DropdownMenuItem>
                                    <LogoutButton />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}