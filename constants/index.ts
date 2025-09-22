import {
  User,
  Heart,
  Package,
  Bell,
  Ticket,
  HeadphonesIcon,
  PhoneIcon,
  ChartPie,
  Tag,
  ShoppingCart,
  ClipboardList,
  Users,
  Percent,
  Star,
  LayoutPanelLeft,
  PencilLine,
  Ruler,
  Store,
  GiftIcon,
  Watch,
  Home,
  Shirt,
  Coffee,
  Hammer,
  Leaf,
  Palette,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { GiRobotGolem } from "react-icons/gi";
export const NavLinks = [
  {
    route: "/clothing",
    label: "Clothing",
  },
  {
    route: "/artisans",
    label: "Artisans",
  },
  {
    route: "/furnishings",
    label: "Furnishings",
  },
  {
    route: "/home-decor",
    label: "Home Decor",
  },
  {
    route: "/food",
    label: "Food & Bevrages",
  },
  {
    route: "/farsan",
    label: "Farsan & Mukhvas",
  },
  {
    route: "/organic",
    label: "Organic",
  },
  {
    route: "/nuts-and-dry-fruit",
    label: "Dry Fruit and Nuts",
  },
];

// New parent categories for the Flipkart-style home navbar
export const ParentCategories = [
  {
    route: "/accessories",
    label: "Accessories",
    icon: Watch,
  },
  {
    route: "/home-decor",
    label: "Home Decor",
    icon: Home,
  },
  {
    route: "/toys-and-games",
    label: "Toys & Games",
    icon: GiRobotGolem,
  },
  {
    route: "/fashion",
    label: "Fashion",
    icon: Shirt,
  },
  {
    route: "/food-and-beverages",
    label: "Food & Beverages",
    icon: Coffee,
  },
  {
    route: "/handicrafts",
    label: "Handicrafts",
    icon: Hammer,
  },
  {
    route: "/organic",
    label: "Organic",
    icon: Leaf,
  },
  {
    route: "/creative-corner",
    label: "Creative Corner",
    icon: Palette,
  },
];

export const FooterLinks = [
  {
    route: "/about-us",
    label: "About us",
  },
  {
    route: "/contact-us",
    label: "Contact us",
  },
  {
    route: "/privacy-policy",
    label: "Privacy Policy",
  },
  {
    route: "/terms-and-condition",
    label: "Terms & Conditions",
  },
  {
    route: "/shipping-policy",
    label: "Shipping Policy",
  },
  {
    route: "/return-policy",
    label: "Return Policy",
  },
];

export const SocialLinks = [
  {
    Icon: FaTwitter,
    url: "/",
  },
  {
    Icon: FaFacebook,
    url: "/",
  },
  {
    Icon: FaInstagram,
    url: "/",
  },
  {
    Icon: FaLinkedin,
    url: "/",
  },
];

export const UserNavLinks = [
  { route: "/profile?section=profile", label: "My Profile", icon: User },
  { route: "/profile?section=wishlist", label: "Wishlist", icon: Heart },
  { route: "/profile?section=orders", label: "Orders", icon: Package },
  {
    route: "/profile?section=notifications",
    label: "Notifications",
    icon: Bell,
  },
  { route: "/profile?section=coupons", label: "Coupons", icon: Ticket },
  {
    route: "/profile?section=customer-care",
    label: "Customer Care",
    icon: HeadphonesIcon,
  },
  {
    route: "/contact-us",
    label: "Contact Us",
    icon: PhoneIcon,
  },
];

export const homeImageCircles = [
  {
    src: "/c1.jpg",
    alt: "Clothes",
    label: "CLOTHING",
  },
  {
    src: "/c2.png",
    alt: "Artisans",
    label: "ARTISAN",
  },
  {
    src: "/c3.png",
    alt: "Organic",
    label: "ORGANIC",
  },
  {
    src: "/c4.png",
    alt: "Foods",
    label: "FOOD's",
  },
];

export const newCollection = [
  {
    src: "/bandhani.png",
    label: "Bandhani",
  },
  {
    bg: "/bg/bg3.jpg",
    title: "CELEBRATION OF INDIAN HERITAGE TEXTILE",
    description: "“ Perpetual legacy hard to find.”",
  },
  {
    src: "/candleHolder.png",
    label: "Candle Holder",
  },
  {
    bg: "/bg/bg3.jpg",
    title: "CHECKOUT OUR EXCLUSIVE COLLECTION",
    description: "“ Beauty tied in Threads...”",
  },
  {
    src: "/cushionCover.jpg",
    label: "Cushion Covers",
  },
  {
    bg: "/bg/bg3.jpg",
    title: "HANDPICKED",
    description: "“ It is not the gift, but the thought that counts.”",
  },
  {
    src: "/laptopBag.jpg",
    label: "Laptop Bag",
  },
  {
    bg: "/bg/bg3.jpg",
    title: "EXPLORE OUR COLLECTION",
    description: "“ Flairs of style Handcrafted with Love.”",
  },
  {
    src: "/diaries.jpg",
    label: "Diaries",
  },
];

export const organicBucket = [
  {
    src: "/organicBucket/roseSoap.png",
    title: "Natural Handmade Olive Rose Soap (100 gms)",
    price: "Rs.400.00",
    wishlist: false,
  },
  {
    src: "/organicBucket/oil.jpg",
    title: "Natural Handmade Nalpamaradi Thailam Oil(50 ml)",
    price: "Rs.400.00",
    wishlist: false,
  },
  {
    src: "/organicBucket/sandalSoap.jpg",
    title: "Sandal - Natural Flora Soap 75 gms",
    price: "Rs.400.00",
    wishlist: true,
  },
  {
    src: "/organicBucket/roomDiffuser.jpg",
    title: "Natural Handmade Grapefruit Oil Room Diffuser (15 ml)",
    price: "Rs.400.00",
    wishlist: false,
  },
];

export const flavoursOfGujarat = [
  {
    src: "/food/chavanu.png",
    label: "Chavanu(ચવાણું)",
  },
  {
    src: "/food/kachori.jpg",
    label: "Kachori(કચોરી)",
  },
  {
    src: "/food/chakri.jpg",
    label: "Chakri(ચક્રી)",
  },
  {
    src: "/food/bhakarvadi.jpg",
    label: "Bhakarwadi(ભાકરવાડી)",
  },
  {
    src: "/food/khakhra.jpg",
    label: "Khakhra(ખાખરા)",
  },
  {
    src: "/food/bhujiya.jpg",
    label: "Sing Bhujiya(સિંગ ભુજિયા)",
  },
];

export const testimonials = [
  {
    src: "/testimonial/t1.jpg",
    author: "Priya Patel",
    position: "Bought Handwoven Mats",
    quote:
      "The quality of the handwoven mat is exceptional. You can feel the dedication of the artisan in every fiber. Perfect addition to my home!",
    rating: 5,
    productType: "Home Decor",
  },
  {
    src: "/testimonial/t2.jpg",
    author: "Raj Mehta",
    position: "Purchased Traditional Footwear",
    quote:
      "The handcrafted leather footwear is not only comfortable but carries the authentic touch of Gujarat's craftsmanship. Absolutely love it!",
    rating: 5,
    productType: "Footwear",
  },
  {
    src: "/testimonial/t3.jpg",

    author: "Meera Shah",
    position: "Regular Customer",
    quote:
      "The handmade soaps and candles have such unique fragrances! Supporting local artisans while getting quality products is a win-win.",
    rating: 5,
    productType: "Home & Wellness",
  },
  {
    src: "/testimonial/t4.png",
    author: "Priya Patel",
    position: "Bought Handwoven Mats",
    quote:
      "The quality of the handwoven mat is exceptional. You can feel the dedication of the artisan in every fiber. Perfect addition to my home!",
    rating: 5,
    productType: "Home Decor",
  },
  {
    src: "/testimonial/t1.jpg",
    author: "Raj Mehta",
    position: "Purchased Traditional Footwear",
    quote:
      "The handcrafted leather footwear is not only comfortable but carries the authentic touch of Gujarat's craftsmanship. Absolutely love it!",
    rating: 5,
    productType: "Footwear",
  },
  {
    src: "/testimonial/t4.png",
    author: "Meera Shah",
    position: "Regular Customer",
    quote:
      "The handmade soaps and candles have such unique fragrances! Supporting local artisans while getting quality products is a win-win.",
    rating: 5,
    productType: "Home & Wellness",
  },
];

export const blogList = [
  {
    id: 1,
    image: "/blog/blog-01.jpg",
    user: "Admin",
    heading: "સંરક્ષણમંત્રી રાજનાથસિંહે ગઈકાલે નવીદિ...",
    date: "13/2/2024",
    description:
      "The mobile app development process and an entrepreneur's journey to starting a business are surprisingly very similar. Just like there is no particular blueprint for starting a business, there is no rigid mobile application development strategy that can be followed.",
  },
  {
    id: 2,
    image: "/blog/blog-02.jpg",
    user: "Admin",
    heading: "Summer Fun: Rediscovering t...",
    date: "13/2/2024",
    description:
      "The mobile app development process and an entrepreneur's journey to starting a business are surprisingly very similar. Just like there is no particular blueprint for starting a business, there is no rigid mobile application development strategy that can be followed.",
  },
  {
    id: 3,
    image: "/blog/blog-03.jpg",
    user: "Admin",
    heading: "Kalighat Painting - The Folk Art...",
    date: "13/2/2024",
    description:
      "The mobile app development process and an entrepreneur's journey to starting a business are surprisingly very similar. Just like there is no particular blueprint for starting a business, there is no rigid mobile application development strategy that can be followed.",
  },
  {
    id: 4,
    image: "/blog/blog-04.jpg",
    user: "Admin",
    heading: "The Journey of Indian Spices",
    date: "13/2/2024",
    description:
      "The mobile app development process and an entrepreneur's journey to starting a business are surprisingly very similar. Just like there is no particular blueprint for starting a business, there is no rigid mobile application development strategy that can be followed.",
  },
  {
    id: 5,
    image: "/blog/blog-05.jpg",
    user: "Admin",
    heading: "રવા ઢોકળા ~ બાફેલા ગુજરાતી નાસ્તા",
    date: "13/2/2024",
    description:
      "The mobile app development process and an entrepreneur's journey to starting a business are surprisingly very similar. Just like there is no particular blueprint for starting a business, there is no rigid mobile application development strategy that can be followed.",
  },
];

export const features = [
  {
    heading: "એકજ ભાવની દુકાન",
    title: "FIXED PRICE SHOP",
    subtitle:
      "Fair and Equal across countries to support art and crafts of India",
  },
  {
    heading: "ખરી પરીક્ષણ",
    title: "100% INVENTORY MODEL",
    subtitle:
      "Our innovative model makes both customers and artisans life easier. All listed products are available and ready to ship",
  },
  {
    heading: "કારીગર પરિવાર",
    title: "350+ ARTISAN'S",
    subtitle:
      "Largest Artisan network nationwide reaching our customers home through the Gujarat Store",
  },
];

export const clothing = [
  {
    src: "/clothing/patola.jpg",
    label: "Patola",
  },
  {
    src: "/clothing/bandhani.png",
    label: "Bandhani",
  },
  {
    src: "/clothing/kurti.png",
    label: "Kurti",
  },
  {
    src: "/clothing/dressMaterials.jpg",
    label: "Dress Materials",
  },
  {
    src: "/clothing/fabrics.png",
    label: "Fabrics",
  },
  {
    src: "/clothing/gajiSilk.jpg",
    label: "Gaji Silk",
  },
  {
    src: "/clothing/dupattas.jpg",
    label: "Dupattas",
  },
  {
    src: "/clothing/stoles.png",
    label: "Stoles",
  },
  {
    src: "/clothing/saree.png",
    label: "Sarees",
  },
  {
    src: "/clothing/cushionCovers.jpg",
    label: "Cushion Covers",
  },
  {
    src: "/clothing/bedCovers.jpg",
    label: "Bed Covers",
  },
  {
    src: "/clothing/curtains.jpg",
    label: "Curtains",
  },
];

export const artisan = [
  {
    src: "/artisan/mats.jpg",
    label: "Mats",
  },
  {
    src: "/artisan/candles.png",
    label: "Candles",
  },
  {
    src: "/artisan/decor.jpg",
    label: "Home Decor",
  },
  {
    src: "/artisan/towels.jpg",
    label: "Dress Towels",
  },
  {
    src: "/artisan/bags.jpg",
    label: "Bags",
  },
  {
    src: "/artisan/organic.png",
    label: "Organic Soaps",
  },
  {
    src: "/artisan/notebooks.jpg",
    label: "Notebooks",
  },
  {
    src: "/artisan/belts.jpg",
    label: "Belts",
  },
  {
    src: "/artisan/footwear.png",
    label: "Footwear",
  },
  {
    src: "/artisan/toys.png",
    label: "Toys",
  },
  {
    src: "/artisan/diaries.jpg",
    label: "Diaries",
  },
  {
    src: "/artisan/pottery.png",
    label: "Pottery",
  },
];

export const furnishings = [
  {
    src: "/furnishings/bambooChair.jpg",
    label: "Bamboo Chair",
  },
  {
    src: "/furnishings/caneChair.jpg",
    label: "Cane Chair",
  },
  {
    src: "/furnishings/handmadeMonochords.jpg",
    label: "Handmade Monochords",
  },
  {
    src: "/furnishings/tissueBox.jpg",
    label: "Tissue Box",
  },
  {
    src: "/furnishings/wickerBaskets.jpg",
    label: "Wicker Baskets",
  },
  {
    src: "/furnishings/woodenSwing.jpg",
    label: "Wooden Swing",
  },
];

export const homeDecor = [
  {
    src: "/homeDecor/Lippan-Art-Wall-Hanging.webp",
    label: "Lippan Art Wall Hanging",
  },
  {
    src: "/homeDecor/madhubaniArtPaintings.jpg",
    label: "Madhubani Art Paintings",
  },
  {
    src: "/homeDecor/madhubaniWallPlates.jpg",
    label: "Madhubani Wall Plates",
  },
  {
    src: "/homeDecor/traditionalToran.jpg",
    label: "Traditional Toran",
  },
  {
    src: "/homeDecor/wallArt.jpg",
    label: "Wall Art",
  },
  {
    src: "/homeDecor/woodenWallHanging.jpg",
    label: "Wooden Wall Hanging",
  },
  {
    src: "/homeDecor/brassPrabhavali.webp",
    label: "Brass Prabhavali",
  },
  {
    src: "/homeDecor/dhoopDani.webp",
    label: "Dhoop Dani",
  },
  {
    src: "/homeDecor/decorativeCushion.jpg",
    label: "Decorative Cushion",
  },
  {
    src: "/homeDecor/candleHolder.jpg",
    label: "Candle Holder",
  },
  {
    src: "/homeDecor/kalighatPaintings.jpg",
    label: "Kalighat Paintngs",
  },
  {
    src: "/homeDecor/rangoliMats.jpg",
    label: "Rangoli Mats",
  },
];

export const organic = [
  {
    src: "/organicBucket/roseSoap.png",
    label: "Natural Handmade Olive Rose Soap ",
  },
  {
    src: "/organicBucket/oil.jpg",
    label: "Natural Handmade Nalpamaradi Thailam Oil",
  },
  {
    src: "/organicBucket/sandalSoap.jpg",
    label: "Sandal - Natural Flora Soap ",
  },
  {
    src: "/organicBucket/roomDiffuser.jpg",
    label: "Grapefruit Oil Room Diffuser",
  },
  {
    src: "/organicBucket/teaTreeOil.jpg",
    label: "Tea Tree Oil",
  },
  {
    src: "/organicBucket/cedarSoap.jpg",
    label: "Cedar Soap",
  },
];

export const vendorSidebarLinks = [
  {
    label: "Dashboard",
    route: "/vendor/dashboard",
    icon: ChartPie,
  },
  {
    label: "Attribute",
    route: "/vendor/attribute",
    icon: Tag,
  },
  {
    label: "Brand",
    route: "/vendor/brand",
    icon: Star,
  },
  {
    label: "Sizes",
    route: "/vendor/size",
    icon: Ruler,
  },
  // {
  //   label: "Categories",
  //   route: [
  //     {
  //       route: "/vendor/category/parentCategory",
  //       label: "Parent Category",
  //     },
  //     {
  //       route: "/vendor/category/primaryCategory",
  //       label: "Primary Category",
  //     },
  //     {
  //       route: "/vendor/category/secondaryCategory",
  //       label: "Secondary Category",
  //     },
  //   ],
  //   icon: LayoutPanelLeft,
  // },
  {
    label: "Products",
    route: "/vendor/products",
    icon: ShoppingCart,
  },
  {
    label: "Orders",
    route: "/vendor/orders",
    icon: ClipboardList,
  },
  {
    label: "Blogs",
    route: "/vendor/blogs",
    icon: PencilLine,
  },
  {
    label: "Customers",
    route: "/vendor/customers",
    icon: Users,
  },
  {
    label: "Referrals",
    route: "/vendor/referrals",
    icon: GiftIcon,
  },
  {
    label: "Discount",
    route: "/vendor/discounts",
    icon: Percent,
  },
];

export const adminSidebarLinks = [
  {
    label: "Dashboard",
    route: "/admin/dashboard",
    icon: ChartPie,
  },
  {
    label: "Attribute",
    route: "/admin/attribute",
    icon: Tag,
  },
  {
    label: "Brand",
    route: "/admin/brand",
    icon: Star,
  },
  {
    label: "Sizes",
    route: "/admin/size",
    icon: Ruler,
  },
  {
    label: "Categories",
    route: [
      {
        route: "/admin/category/parentCategory",
        label: "Parent Category",
      },
      {
        route: "/admin/category/primaryCategory",
        label: "Primary Category",
      },
      {
        route: "/admin/category/secondaryCategory",
        label: "Secondary Category",
      },
    ],
    icon: LayoutPanelLeft,
  },
  {
    label: "Products",
    route: "/admin/products",
    icon: ShoppingCart,
  },
  {
    label: "Orders",
    route: "/admin/orders",
    icon: ClipboardList,
  },
  {
    label: "Blogs",
    route: "/admin/blogs",
    icon: PencilLine,
  },
  {
    label: "Vendors",
    route: "/admin/vendors",
    icon: Store,
  },
  {
    label: "Customers",
    route: "/admin/customers",
    icon: Users,
  },
  {
    label: "Referrals",
    route: "/admin/referrals",
    icon: GiftIcon,
  },
  {
    label: "Discount",
    route: "/admin/discounts",
    icon: Percent,
  },
];

export const CACHE_TTL = 300; // 5 minutes in seconds
