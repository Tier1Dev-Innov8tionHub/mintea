import { BrandMark } from "@/components/brand/brand-mark";

export default function OfflinePage() {
  return (
    <div className="mint-gradient flex min-h-screen items-center justify-center p-6 text-center">
      <div className="animate-fade-up">
        <BrandMark size="lg" stacked className="mb-6 justify-center" />
        <p className="max-w-xs text-sm text-white/85">
          You&apos;re offline. Reconnect to sync your shared workspace.
        </p>
      </div>
    </div>
  );
}
