"use client";

import { useState } from "react";
import { Settings, User, Bell, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    printUpdates: true,
    documentAccess: true,
    expiryReminders: true,
    marketing: false,
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your account details. These are tied to your login provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={session?.user?.name ?? ""} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={session?.user?.email ?? ""} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose which events you want to be notified about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Print job updates</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified when your print jobs start, complete, or fail.
                </p>
              </div>
              <Switch
                checked={notifications.printUpdates}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, printUpdates: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Document access requests</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Know when someone requests access to your secure documents.
                </p>
              </div>
              <Switch
                checked={notifications.documentAccess}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, documentAccess: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Expiry reminders</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get reminded before your documents expire.
                </p>
              </div>
              <Switch
                checked={notifications.expiryReminders}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, expiryReminders: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Promotional emails</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Occasional offers and product news.
                </p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, marketing: v }))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
