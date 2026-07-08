import { SignUp } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand/brand-mark";

export default function SignUpPage() {
  return (
    <div className="mint-gradient flex min-h-screen flex-col items-center justify-center px-6">
      <BrandMark size="lg" stacked className="mb-8" />
      <SignUp />
    </div>
  );
}
