"use client";
import Hero from "@/components/Hero";
import NewCollection from "@/components/NewCollection";
import OrganicAndFlavours from "@/components/OrganicAndFlavours";
import Testimonials from "@/components/Testimonials";

const ClientHomePage = () => {
  return (
    <div className="min-h-screen parallax-element">
      <Hero />
      <NewCollection />
      <OrganicAndFlavours />
      <Testimonials />
    </div>
  );
};

export default ClientHomePage;
