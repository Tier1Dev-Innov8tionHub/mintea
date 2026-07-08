"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useSettings, useFinanceMutations } from "@/lib/db/hooks";
import { Leaf, Trash2, Smartphone, LogOut } from "lucide-react";
import type { Settings } from "@/lib/db/schema";

function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { updateSettings, clearHousehold } = useFinanceMutations();
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget));
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSave = async () => {
    await updateSettings({
      displayName,
      monthlyBudget: parseFloat(monthlyBudget) || 3500,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearHousehold();
      setShowClearConfirm(false);
      router.push("/");
      router.refresh();
    } finally {
      setClearing(false);
    }
  };

  return (
    <MobileShell title="Settings" showBack>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <Input
              label="Display Name"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              label="Monthly Budget"
              type="number"
              placeholder="3500"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
            <Button onClick={handleSave} className="w-full">
              {saved ? "Saved!" : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold">Install as App</p>
                <p className="mt-1 text-sm text-gray-500">
                  On iPhone: Share → Add to Home Screen. On Android: menu → Install
                  app. You&apos;ll get the mint splash and home-screen icon. Data
                  syncs to the cloud when you&apos;re online.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              <p className="font-semibold">About mintea</p>
            </div>
            <p className="text-sm text-gray-500">
              mintea is a shared workspace with private personal accounts when you
              need them. Joint and business accounts stay visible to both of you.
              Data syncs via Convex on any device.
            </p>
            <p className="text-xs text-gray-400 mt-2">Version 0.1.0</p>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => void signOut({ redirectUrl: "/sign-in" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={() => setShowClearConfirm(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear all data
        </Button>
      </div>

      <Modal
        open={showClearConfirm}
        onClose={() => !clearing && setShowClearConfirm(false)}
        title="Clear all data?"
      >
        <p className="text-sm text-gray-600 mb-4">
          This deletes all transactions, budgets, goals, recurring items, and accounts, then starts
          fresh with default categories and an empty checking account. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(false)}
            className="flex-1"
            disabled={clearing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            className="flex-1"
            disabled={clearing}
          >
            {clearing ? "Clearing…" : "Clear everything"}
          </Button>
        </div>
      </Modal>
    </MobileShell>
  );
}

export default function SettingsPage() {
  const { settings } = useSettings();

  if (!settings) {
    return (
      <MobileShell title="Settings" showBack>
        <p className="text-sm text-gray-500">Loading settings…</p>
      </MobileShell>
    );
  }

  return <SettingsForm settings={settings} />;
}
