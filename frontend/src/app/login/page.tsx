"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { GoogleButton } from "@/components/auth/google-button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/user";
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace(from || "/user");
      }
    }
  }, [status, session, router, from]);

  const onUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: from,
      });

      if (res?.error) {
        setError("Invalid user credentials. Try email: user@test.com, password: password");
      } else if (res?.url) {
        router.push(res.url);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onCafeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/admin",
      });

      if (res?.error) {
        setError("Invalid cafe credentials. Try email: admin@test.com, password: password");
      } else if (res?.url) {
        router.push("/admin");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="p-4 md:p-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Cyber SaaS</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to continue to your dashboard
            </p>
          </div>

          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="user">Public (User)</TabsTrigger>
              <TabsTrigger value="cafe">Cyber Cafe (Admin)</TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <Card>
                <CardHeader>
                  <CardTitle>Gamer / Customer</CardTitle>
                  <CardDescription>
                    Sign in to manage your sessions, print jobs, and wallet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {error}
                    </div>
                  )}
                  <form onSubmit={onUserSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email</Label>
                      <Input
                        id="user-email"
                        name="email"
                        type="email"
                        placeholder="Ex: user@test.com"
                        defaultValue="user@test.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-password">Password</Label>
                      <Input
                        id="user-password"
                        name="password"
                        type="password"
                        placeholder="Ex: password"
                        defaultValue="password"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In as User
                    </Button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <GoogleButton
                    callbackUrl={from}
                    roleHint="public"
                    className="w-full h-12"
                  />

                  <p className="text-sm text-center text-muted-foreground mt-4">
                    Don&apos;t have an account?{" "}
                    <Link
                      href={`/signup?from=${encodeURIComponent(from)}`}
                      className="text-primary hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cafe">
              <Card>
                <CardHeader>
                  <CardTitle>Cafe Administrator</CardTitle>
                  <CardDescription>
                    Manage your terminals, billing, and cafe settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {error}
                    </div>
                  )}
                  <form onSubmit={onCafeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cafe-email">Admin Email</Label>
                      <Input
                        id="cafe-email"
                        name="email"
                        type="email"
                        placeholder="Ex: admin@test.com"
                        defaultValue="admin@test.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cafe-password">Password</Label>
                      <Input
                        id="cafe-password"
                        name="password"
                        type="password"
                        placeholder="Ex: password"
                        defaultValue="password"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In as Admin
                    </Button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <GoogleButton
                    callbackUrl="/admin"
                    roleHint="cafe"
                    className="w-full h-12"
                  />

                  <p className="text-sm text-center text-muted-foreground mt-4">
                    Don&apos;t have a cafe account?{" "}
                    <Link href="/register/cafe" className="text-primary hover:underline">
                      Register here
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
