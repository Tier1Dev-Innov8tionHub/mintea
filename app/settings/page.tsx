"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { getSettings, updateSettings, clearAllData, seedDatabase } from "@/lib/db/seed";
import { Leaf, Trash2, Smartphone } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("3500");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setDisplayName(s.displayName);
      setMonthlyBudget(String(s.monthlyBudget));
    });
  }, []);

  const handleSave = async () => {
    await updateSettings({
      displayName,
      monthlyBudget: parseFloat(monthlyBudget) || 3500,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    await clearAllData();
    await seedDatabase();
    setShowClearConfirm(false);
    router.push("/");
    router.refresh();
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
                <p className="text-sm text-gray-500 mt-1">
                  On iPhone: tap Share → Add to Home Screen. On Android: tap the menu → Install app.
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
              mintea is a personal finance tracker. All your data is stored locally in your browser — nothing is sent to any server.
            </p>
            <p className="text-xs text-gray-400 mt-2">Version 0.1.0</p>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={() => setShowClearConfirm(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </div>

      <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data?">
        <p className="text-sm text-gray-600 mb-4">
          This will delete all your transactions, budgets, goals, and settings, then reload with demo data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClear} className="flex-1">
            Clear Data
          </Button>
        </div>
      </Modal>
    </MobileShell>
  );
}
