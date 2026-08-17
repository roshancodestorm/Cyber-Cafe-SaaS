"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function CafeRegistrationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await apiClient.registerCafe(data);
      setSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Registration Successful</CardTitle>
            <CardDescription>Your cyber cafe application is under review.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              We have received your application. Our team will verify your details and contact you shortly with the next steps to activate your terminal licenses.
            </p>
            <Link href="/login" className="block w-full">
              <Button className="w-full">Return to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg space-y-6">
        <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </Link>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Partner with Us</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Register your Cyber Cafe to access the management dashboard.
          </p>
        </div>

        <Card>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cafeName">Cafe / Business Name</Label>
                <Input id="cafeName" name="cafeName" placeholder="e.g. Nexus Esports" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input id="email" name="email" type="email" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terminals">Estimated Number of Terminals</Label>
                <Input id="terminals" name="terminals" type="number" min="1" required disabled={isLoading} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Registration
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
