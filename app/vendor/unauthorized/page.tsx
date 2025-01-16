// pages/unauthorized.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-4">
          This area is restricted to vendors only. If you&apos;re interested in
          becoming a vendor, please sign up for a vendor account.
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button asChild variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild>
            <Link href="/vendor/sign-up">Become a Vendor</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
