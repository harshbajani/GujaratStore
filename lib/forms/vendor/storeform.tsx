/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Building,
  Globe,
  Home,
  MapPin,
  MapPinned,
  Phone,
  Store,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { storeSchema } from "../../validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegionDropdown } from "react-country-region-selector";
import {
  createStore,
  getStore,
  updateStore,
} from "../../actions/storeProfile.actions";
import { useToast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";

type StoreInfo = z.infer<typeof storeSchema>;

const Storeform = () => {
  // * useStates and hooks
  const [country] = useState("India");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<StoreInfo>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: "",
      contact: "",
      address: {
        address_line_1: "",
        address_line_2: "",
        city: "",
        locality: "",
        pincode: "",
        state: "",
        landmark: "",
      },
      alternativeContact: "",
    },
  });
  // * data submission of store
  const onSubmit = async (data: StoreInfo) => {
    try {
      console.log("[Storeform] onSubmit called with data:", data);
    } catch {}
    setIsLoading(true);
    try {
      // First check if store exists
      console.log("[Storeform] Calling getStore()");
      const existingStore = await getStore();
      console.log("[Storeform] getStore() response:", existingStore);

      let result;
      if (existingStore.success) {
        // Update existing store
        console.log("[Storeform] Updating existing store");
        result = await updateStore(data);
      } else {
        // Create new store
        console.log("[Storeform] Creating new store");
        result = await createStore(data);
      }

      console.log("[Storeform] Result:", result);
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Store details saved successfully!",
      });
      router.push("/vendor/dashboard");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save store details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // * fetch store data
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const storeData = await getStore();

        if (storeData.success && storeData.data) {
          form.reset({
            storeName: storeData.data.storeName,
            contact: storeData.data.contact,
            address: {
              address_line_1: storeData.data.address.address_line_1,
              address_line_2: storeData.data.address.address_line_2,
              city:
                (storeData.data.address as any).city ||
                storeData.data.address.address_line_2,
              locality:
                storeData.data.address.locality ||
                storeData.data.address.address_line_2,
              pincode: storeData.data.address.pincode,
              state: storeData.data.address.state,
              landmark: storeData.data.address.landmark || "",
            },
            alternativeContact: storeData.data.alternativeContact || "",
          });
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      }
    };

    fetchStoreData();
  }, [form]);

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-brand/5 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-playfair">
                  Store Settings
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage your store profile and preferences
                </CardDescription>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-brand" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Profile Section */}
              <div className="space-y-4">
                <div>
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Store Name*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Store className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="address.address_line_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Area / Locality*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          City*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="address.pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Pincode*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Store Settings */}
              <div className="space-y-4">
                <div>
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Contact*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="address.locality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Locality*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <MapPinned className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="address.landmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Landmark
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Building className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <FormField
                    control={form.control}
                    name="address.address_line_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Address (Area & Street)*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Home className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          State*
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />

                            <RegionDropdown
                              country={country}
                              value={field.value}
                              onChange={field.onChange}
                              defaultOptionLabel="Select a state"
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 no-border bg-muted/50 pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="alternativeContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Alternate Contact
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input {...field} className="bg-muted/50 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-end justify-end">
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link prefetch href="/vendor/dashboard">
                  Cancel
                </Link>
              </Button>
              <Button className="bg-brand hover:bg-brand/90" type="submit">
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default Storeform;
