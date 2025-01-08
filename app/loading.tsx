"use client";

import Loader from "@/components/Loader";

const LoadingPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader />
    </div>
  );
};

export default LoadingPage;
