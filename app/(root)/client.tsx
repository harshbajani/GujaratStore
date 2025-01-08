"use client";

import Hero from "@/components/Hero";
import NewCollection from "@/components/NewCollection";
import OrganicAndFlavours from "@/components/OrganicAndFlavours";
import Testimonials from "@/components/Testimonials";
import { useAuth } from "@/hooks/useAuth";
import Blogs from "./blog/page";

const ClientHomePage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Hero />
        <NewCollection />
        <OrganicAndFlavours />
        <Testimonials />
        <Blogs />
      </div>
    );
  }
};

export default ClientHomePage;
