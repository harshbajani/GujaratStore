"use client";

import { withVendorProtection } from "../HOC";
import DashboardPage from "@/app/vendor/(root)/dashboard/page";

const AdminPage = () => {
  return <DashboardPage />;
};

export default withVendorProtection(AdminPage);
