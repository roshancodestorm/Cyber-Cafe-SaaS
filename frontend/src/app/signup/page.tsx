"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { Loader2, ArrowLeft } from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/user/cafes";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(
          errData.detail || "Registration failed. This email may already be registered."
        );
        setIsLoading(false);
        return;
      }

      const user = await res.json();

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Registration successful but sign-in failed. Please try signing in.");
        setIsLoading(false);
        return;
      }

      router.push(signInRes?.url || from);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Join the community and start discovering cafes
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Sign up</CardTitle>
              <CardDescription>Enter your details to create an account</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstname">First Name</Label>
                    <Input
                      id="signup-firstname"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: John"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-lastname">Last Name</Label>
                    <Input
                      id="signup-lastname"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: Doe"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Ex: user@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Ex: Password@123 (min 8 chars)"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
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

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href={`/login?from=${encodeURIComponent(from)}`}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
