import { artisan, clothing, flavoursOfGujarat } from "@/constants";
import Image from "next/image";

const ClientShopPage = () => {
  return (
    <div className="min-h-screen">
      <div className="relative min-h-[180px] w-full sm:min-h-[220px] md:min-h-[240px]">
        <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_50%_right_200px] h-[273px]" />
        <div className="absolute inset-0 bg-brand-200/30 h-[273px]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center sm:p-6 md:p-8 mt-14">
          <h1 className="h1 mb-2 text-2xl sm:text-3xl md:text-4xl sm:mt-14 mt-20">
            નમસ્તે જી
          </h1>
          <p className="subtitle-1 text-sm sm:text-base md:text-lg">
            Let&apos;s Discover The World Of Gujarat Art & Crafts
          </p>
        </div>
      </div>

      <div className="pt-8">
        <div className="py-16 flex-center flex-col">
          <div className="flex-center gap-2 mb-8">
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={25}
              height={25}
            />
            <h1 className="h2">Clothing</h1>
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={25}
              height={25}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 max-w-7xl gap-8 mx-auto px-4">
            {clothing.map((item, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden"
              >
                <Image
                  src={item.src}
                  alt={item.label}
                  width={170}
                  height={200}
                  className="w-full h-44 object-cover rounded  hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent rounded-b" />
                <h2 className="absolute bottom-2 w-full text-center text-white subtitle-1">
                  {item.label}
                </h2>
              </div>
            ))}
          </div>

          <div className="flex-center gap-2 mb-8 pt-16">
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={25}
              height={25}
            />
            <h1 className="h2">Artisan&apos;s</h1>
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={25}
              height={25}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 max-w-7xl gap-8 mx-auto px-4">
            {artisan.map((item, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden"
              >
                <Image
                  src={item.src}
                  alt={item.label}
                  width={170}
                  height={200}
                  className="w-full h-44 object-cover rounded  hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent rounded-b" />
                <h2 className="absolute bottom-2 w-full text-center text-white subtitle-1">
                  {item.label}
                </h2>
              </div>
            ))}
          </div>

          <div className="flex-center gap-2 mb-8 pt-16">
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={25}
              height={25}
            />
            <h1 className="h2">Farsan</h1>
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={25}
              height={25}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 max-w-7xl gap-8 mx-auto px-4">
            {flavoursOfGujarat.map((item, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden"
              >
                <Image
                  src={item.src}
                  alt={item.label}
                  width={170}
                  height={200}
                  className="w-full h-44 object-cover rounded  hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent rounded-b" />
                <h2 className="absolute bottom-2 w-full text-center text-white subtitle-1">
                  {item.label}
                </h2>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientShopPage;
