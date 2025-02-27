import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div className="mt-28 min-h-screen">{children}</div>;
};

export default Layout;
