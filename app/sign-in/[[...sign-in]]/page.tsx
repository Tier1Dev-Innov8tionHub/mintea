import { SignIn } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand/brand-mark";

export default function SignInPage() {
  return (
    <div className="mint-gradient flex min-h-screen flex-col items-center justify-center px-6">
      <BrandMark size="lg" stacked className="mb-8" />
      <SignIn />
    </div>
  );
}
