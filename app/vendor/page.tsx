"use client";

import DashboardPage from "./dashboard/page";
import { useSession } from "next-auth/react";

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

export default AdminPage;
