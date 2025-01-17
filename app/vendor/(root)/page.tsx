"use client";

import { withVendorProtection } from "../HOC";
import { useSession } from "next-auth/react";
import DashboardPage from "@/app/vendor/(root)/dashboard/page";

const AdminPage = () => {
  const { data: session } = useSession();

  return (
    <>
      {session?.user.role === "vendor" && (
        <>
          <DashboardPage />
        </>
      )}
    </>
  );
};

export default withVendorProtection(AdminPage);
