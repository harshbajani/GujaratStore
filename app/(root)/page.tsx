import BlogPage from "./blog/page";
import ClientHomePage from "./client";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <ClientHomePage />
      <BlogPage />
    </>
  );
}
