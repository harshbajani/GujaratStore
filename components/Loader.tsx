"use client";

import Image from "next/image";

const Loader = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Image
        src="/loader.svg"
        alt="loader"
        height={500}
        width={500}
        className="size-6 animate-spin text-muted-foreground"
      />
    </div>
  );
};

export default Loader;
