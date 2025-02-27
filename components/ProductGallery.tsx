import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

interface ProductGalleryProps {
  images: (string | File)[];
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  // Combine cover image with product images
  const allImages = [...images];

  const getImageSrc = (img: string | File) => {
    if (typeof img === "string") {
      return `/api/files/${img}`;
    }
    return URL.createObjectURL(img);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Swiper */}
      <Swiper
        spaceBetween={10}
        navigation={true}
        loop={true}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        modules={[FreeMode, Navigation, Thumbs]}
        className="mb-4 rounded-lg product-main-swiper"
      >
        {allImages.map((img, index) => (
          <SwiperSlide key={index}>
            <div className="aspect-square relative w-full">
              <Image
                src={getImageSrc(img)}
                alt={`Product image ${index + 1}`}
                fill
                className="object-contain"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnail Swiper */}
      <div className="max-w-md mx-auto">
        <Swiper
          onSwiper={(swiper) => setThumbsSwiper(swiper)}
          spaceBetween={8}
          slidesPerView={4}
          freeMode={true}
          loop={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="thumbs-gallery"
        >
          {allImages.map((img, index) => (
            <SwiperSlide key={index} className="cursor-pointer">
              <div className="relative w-20 h-20">
                <Image
                  src={getImageSrc(img)}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ProductGallery;
