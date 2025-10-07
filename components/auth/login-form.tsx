'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn } from "next-auth/react";
import { useState } from "react"
import { toast } from 'sonner'

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Callback URI
    const callbackUrl = "/home";

    // Credentials Login
    const handleCredentialsSignIn = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const results = await signIn("credentials", {
                email,
                password,
                redirect: false, // Handle Redirect Manually
                callbackUrl
            });
            if (results?.error) {
                console.error("Login failed:", results.error);
                toast.error("Wrong credentials!");
            } else {
                window.location.href = callbackUrl; // Manual redirect on success
                toast.success("Welcome Back")
            }
        } catch (error) {
            console.error("Sign-in error:", error);
            toast.error("Login Failed. Try Again Later")
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">Login to your account</CardTitle>
                    <CardDescription>
                        Enter your credentials below to continue to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCredentialsSignIn}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline" >Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} required />
                            </div>
                            <div className="flex flex-col gap-3">
                                {loading ? (
                                    <Button className="w-full cursor-not-allowed" disabled>
                                        Signing In...
                                    </Button>
                                ) : (
                                    <Button type="submit" className="w-full cursor-pointer">
                                        Sign In
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="#" className="underline underline-offset-4">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}