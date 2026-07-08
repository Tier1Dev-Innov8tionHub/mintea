"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { GoalProgressCard } from "@/components/dashboard/cards";
import { GoalIcon } from "@/components/icons/category-icon";
import { useGoals, useFinanceMutations } from "@/lib/db/hooks";
import { formatCurrency } from "@/lib/format";
import { goalProgress } from "@/lib/calculations";
import { Plus } from "lucide-react";

const GOAL_ICONS = ["piggy-bank", "umbrella", "palmtree", "laptop", "home"];

function GoalRing({
  progress,
  icon,
  current,
  target,
}: {
  progress: number;
  icon: string;
  current: number;
  target: number;
}) {
  const size = 168;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, progress)) / 100) * c;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <GoalIcon icon={icon} size={28} className="mb-1 text-white" />
        <p className="text-3xl font-bold tabular-nums">
          {formatCurrency(current)}
        </p>
        <p className="mt-0.5 text-xs text-white/80">
          {Math.round(progress)}% of {formatCurrency(target)}
        </p>
      </div>
    </div>
  );
}

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
  const selectedProgress = selectedGoal ? goalProgress(selectedGoal) : 0;

  return (
    <MobileShell title="Goals">
      <div className="animate-fade-up space-y-4">
        <p className="px-0.5 text-sm text-gray-500">
          Track your savings goals and watch your progress grow.
        </p>

        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalProgressCard
              key={goal.id}
              goal={goal}
              onClick={() => setShowDeposit(goal.id)}
            />
          ))}
        </div>

        {goals.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-sm text-gray-400">
              No goals yet. Create your first savings goal!
            </CardContent>
          </Card>
        )}

        <Button
          onClick={() => setShowAdd(true)}
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="New Goal">
        <div className="space-y-4">
          <Input
            label="Goal Name*"
            placeholder="Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Target Amount*"
            type="number"
            placeholder="5000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <div>
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">Icon</p>
            <div className="flex gap-3">
              {GOAL_ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                    icon === i
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200"
                  }`}
                >
                  <GoalIcon icon={i} />
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleAddGoal}
            className="w-full"
            disabled={!name || !target}
          >
            Create Goal
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!showDeposit}
        onClose={() => setShowDeposit(null)}
        title={selectedGoal?.name ?? "Deposit"}
      >
        {selectedGoal && (
          <div className="space-y-5">
            <div className="mint-gradient -mx-4 -mt-2 rounded-b-3xl px-4 pb-8 pt-4">
              <GoalRing
                progress={selectedProgress}
                icon={selectedGoal.icon}
                current={selectedGoal.currentAmount}
                target={selectedGoal.targetAmount}
              />
            </div>

            <Card>
              <CardContent className="space-y-0 divide-y divide-gray-100 p-0">
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">Total Goal</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(selectedGoal.targetAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">Saved</span>
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatCurrency(selectedGoal.currentAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">Remaining</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(
                      Math.max(
                        0,
                        selectedGoal.targetAmount - selectedGoal.currentAmount,
                      ),
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl bg-gray-100 px-4 py-6 text-center">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Add money
              </p>
              <input
                type="number"
                placeholder="$0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-transparent text-center text-4xl font-bold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeposit(null)}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                className="w-full"
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                Add Money
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
}
