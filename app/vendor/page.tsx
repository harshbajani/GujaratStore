"use client";

import DashboardPage from "./dashboard/page";
import { useSession } from "next-auth/react";
import { withVendorProtection } from "./HOC";

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
