import { SignIn } from "@clerk/nextjs";
import { Leaf } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-700 to-teal-500 px-6">
      <div className="mb-6 flex items-center gap-2 text-white">
        <Leaf className="h-7 w-7" />
        <h1 className="text-3xl font-bold">mintea</h1>
      </div>
      <SignIn />
    </div>
  );
}
