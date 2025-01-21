"use client";
import Hero from "@/components/Hero";
import NewCollection from "@/components/NewCollection";
import OrganicAndFlavours from "@/components/OrganicAndFlavours";
import Testimonials from "@/components/Testimonials";
import { useAuth } from "@/hooks/useAuth";

const ClientHomePage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Hero />
        <NewCollection />
        <OrganicAndFlavours />
        <Testimonials />
      </div>
    );
  }
  return null;
};

export default ClientHomePage;
