"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "@/constants";
import { inquirySchema } from "@/lib/validations";
import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { createInquiry } from "@/lib/actions/inquiry.actions";
import { useToast } from "@/hooks/use-toast";

const ContactPage = () => {
  // * useStates and hooks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  type InquiryData = z.infer<typeof inquirySchema>;
  const form = useForm({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  // * handlers and onSubmit to submit data
  const onSubmit = async (data: InquiryData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value || "");
      });
      const result = await createInquiry(formData);
      if (result.success) {
        toast({ title: "Success", description: "Inquiry sent successfully." });
        form.reset({
          name: "",
          email: "",
          phone: "",
          message: "",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as Error).message === "This email is already registered."
          ? "This email is already registered. Please use another email."
          : (error as Error).message ===
            "This phone number is already registered."
          ? "This phone number is already registered. Please use another number."
          : "Failed to send inquiry. Please try again later.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full mx-auto pt-12 md:pt-10 lg:pt-14 lg:px-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 lg:gap-48 items-center">
        {/* Left Section - Form */}
        <div className="p-4 sm:p-8 lg:p-20 space-y-6 md:space-y-8">
          <div className="space-y-1">
            <p className="text-xl text-center sm:text-start sm:text-xl font-normal font-playfair">
              Let&apos;s
            </p>
            <h1 className="text-3xl sm:text-4xl text-center sm:text-start font-bold font-playfair">
              Connect
            </h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        className="border-gray-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Email Id</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="border-gray-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Mobile No.</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="0123456789"
                        className="border-gray-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Let's talk"
                        className="min-h-[120px] border-gray-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full sm:w-32 bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Send Message"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Section with red background */}
        <div className="relative bg-red-600 p-6 sm:p-8 text-white min-h-[500px] sm:min-h-[550px] lg:h-[600px] w-full xl:w-[552px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Map overlay */}
            <div className="hidden sm:block absolute md:left-5 top-10 w-2/4 lg:-ml-36 ">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[420px] md:h-[500px] xl:h-[520px] w-[300px] md:w-[310px] xl:w-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d230.68900762413762!2d73.23401023530472!3d22.314927459267135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fcf834404785d%3A0x6a0d68c29605ea9b!2sc%2C%20D-16%2C%20Rd%20Number%201%2C%20Bhagya%20Laxmi%20Nagar%2C%20Sardar%20Estate%2C%20Sayaji%20Park%20Society%2C%20Vadodara%2C%20Gujarat%20390019!5e0!3m2!1sen!2sin!4v1736758779257!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="col-span-1 sm:col-start-2 space-y-6 sm:space-y-8">
              <div className="space-y-12 sm:space-y-20 flex items-start justify-start flex-col">
                <div className="space-y-2 w-full">
                  <div className="flex flex-col items-start justify-start mt-4 sm:mt-10 gap-6 sm:gap-8">
                    <div>
                      <span className="font-semibold text-base sm:text-lg flex gap-2 items-center">
                        <Phone className="w-5 h-5" />
                        Mobile No.
                      </span>
                      <span className="block mt-1">0123456789</span>
                    </div>
                    <div>
                      <span className="font-semibold text-base sm:text-lg flex gap-2 items-center">
                        <Mail className="w-5 h-5" />
                        E-mail
                      </span>
                      <span className="block mt-1">abc@gmail.com</span>
                    </div>
                    <div className="mb-6 sm:mb-10">
                      <span className="font-semibold text-base sm:text-lg flex gap-2 items-center">
                        <MapPin className="w-5 h-5" />
                        Address
                      </span>
                      <p className="mt-1">
                        C-16/17 B, Road no. 1, Sardar Estate,
                        <br />
                        Ajwa Road,
                        <br />
                        Vadodara-390019.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <span className="font-semibold text-base sm:text-lg block">
                        Follow us at
                      </span>
                      <div className="flex gap-4">
                        {SocialLinks.map((social, index) => (
                          <Link
                            prefetch
                            key={index}
                            href={social.url}
                            className="text-white hover:opacity-80 transition-opacity"
                          >
                            <Image
                              src={social.src}
                              width={24}
                              height={24}
                              alt={`${social.url} icon`}
                              className="w-5 h-5 sm:w-6 sm:h-6"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
