"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { GoalProgressCard } from "@/components/dashboard/cards";
import { GoalIcon } from "@/components/icons/category-icon";
import { useGoals, useFinanceMutations } from "@/lib/db/hooks";
import { formatCurrency } from "@/lib/format";
import { Plus } from "lucide-react";

const GOAL_ICONS = ["piggy-bank", "umbrella", "palmtree", "laptop", "home"];

export default function GoalsPage() {
  const goals = useGoals();
  const { addGoal, depositToGoal } = useFinanceMutations();
  const [showAdd, setShowAdd] = useState(false);
  const [showDeposit, setShowDeposit] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("piggy-bank");

  const handleAddGoal = async () => {
    if (!name || !target) return;
    await addGoal({
      name,
      icon,
      targetAmount: parseFloat(target),
      currentAmount: 0,
      status: "active",
    });
    setName("");
    setTarget("");
    setShowAdd(false);
  };

  const handleDeposit = async () => {
    if (!showDeposit || !depositAmount) return;
    await depositToGoal(showDeposit, parseFloat(depositAmount));
    setDepositAmount("");
    setShowDeposit(null);
  };

  const selectedGoal = goals.find((g) => g.id === showDeposit);

  return (
    <MobileShell title="Goals">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Track your savings goals and watch your progress grow.
        </p>

        <div className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id}>
              <GoalProgressCard goal={goal} onClick={() => setShowDeposit(goal.id)} />
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No goals yet. Create your first savings goal!</p>
          </div>
        )}

        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="New Goal">
        <div className="space-y-4">
          <Input label="Goal Name*" placeholder="Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Target Amount*" type="number" placeholder="5000" value={target} onChange={(e) => setTarget(e.target.value)} />
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 px-1">Icon</p>
            <div className="flex gap-3">
              {GOAL_ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                    icon === i ? "border-emerald-600 bg-emerald-50" : "border-gray-200"
                  }`}
                >
                  <GoalIcon icon={i} />
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleAddGoal} className="w-full" disabled={!name || !target}>Create Goal</Button>
        </div>
      </Sheet>

      <Sheet open={!!showDeposit} onClose={() => setShowDeposit(null)} title="Deposit">
        {selectedGoal && (
          <div className="space-y-6">
            <div className="text-center border-b border-gray-100 pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GoalIcon icon={selectedGoal.icon} size={24} />
                <p className="font-semibold text-lg">To {selectedGoal.name}</p>
              </div>
              <p className="text-sm text-gray-500">
                {formatCurrency(selectedGoal.currentAmount)} saved of {formatCurrency(selectedGoal.targetAmount)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-100 px-4 py-6 text-center">
              <input
                type="number"
                placeholder="$0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-transparent text-4xl font-bold text-center focus:outline-none"
              />
            </div>
            <Button
              onClick={handleDeposit}
              className="w-full"
              disabled={!depositAmount || parseFloat(depositAmount) <= 0}
            >
              Transfer
            </Button>
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
}
