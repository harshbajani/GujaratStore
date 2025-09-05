import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <div className="relative min-h-[180px] w-full sm:min-h-[220px] md:min-h-[240px] mb-7">
        <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_50%_right_200px] h-[273px]" />
        <div className="absolute inset-0 bg-brand-200/30 h-[273px]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center sm:p-6 md:p-8 ">
          <h1 className="h1 mb-2 text-2xl sm:text-3xl md:text-4xl sm:mt-14 mt-20">
            નમસ્તે જી
          </h1>
          <p className="subtitle-1 text-sm sm:text-base md:text-lg">
            Let&apos;s Discover The World Of Gujarat Art & Crafts
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};

export default layout;
