"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/Loader";
import { useToast } from "@/hooks/use-toast";
import { RegionDropdown } from "react-country-region-selector";
import { createVendor } from "@/lib/actions/admin/vendor.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vendorAddSchema } from "@/lib/validations";
import { Switch } from "@/components/ui/switch";

type VendorAddFormValues = z.infer<typeof vendorAddSchema>;

const AddVendorAdminForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [country] = useState("India");

  const form = useForm<VendorAddFormValues>({
    resolver: zodResolver(vendorAddSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      isVerified: false,
      emailVerified: true,
      store: {
        storeName: "",
        contact: "",
        addresses: {
          address_line_1: "",
          address_line_2: "",
          locality: "",
          pincode: "",
          state: "",
          landmark: "",
        },
        alternativeContact: "",
      },
      bankDetails: {
        bankName: "",
        bankCode: "",
        ifscCode: "",
        accountHolderName: "",
        accountNumber: "",
        accountType: "savings",
      },
    },
  });

  const onSubmit = async (data: VendorAddFormValues) => {
    setLoading(true);
    try {
      // Append verification flags since vendor is created by admin
      const payload = { ...data, isVerified: true, emailVerified: true };

      const result = await createVendor(payload);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Vendor created successfully",
        });
        router.push("/admin/vendors");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Something went wrong",
        });
      }
    } catch (error) {
      console.error("Create vendor error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add vendor",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="text-2xl font-semibold">Add Vendor</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Vendor Profile Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Vendor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vendor name" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter vendor email"
                            {...field}
                            type="email"
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter vendor phone"
                            {...field}
                            type="number"
                            maxLength={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Store Details Section */}
              <div className="border rounded-lg p-6 bg-muted/20">
                <h3 className="text-lg font-medium mb-4">Store Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="store.storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter store name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="store.contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Contact*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter store contact"
                            {...field}
                            type="number"
                            maxLength={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="store.alternativeContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternate Contact</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter alternate contact"
                            {...field}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Section */}
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-4">Store Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="store.addresses.address_line_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Area & Street)*</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter address line 1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="store.addresses.address_line_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City/District/Town*</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter address line 2"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="store.addresses.locality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Locality*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter locality" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="store.addresses.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode*</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter pincode"
                              {...field}
                              maxLength={6}
                              type="number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="store.addresses.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State*</FormLabel>
                          <FormControl>
                            <RegionDropdown
                              country={country}
                              value={field.value}
                              onChange={field.onChange}
                              defaultOptionLabel="Select a state"
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="store.addresses.landmark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landmark</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter landmark (optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Detail Section */}
              <div className="border rounded-lg p-6 bg-muted/20 mt-8">
                <h3 className="text-lg font-medium mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bankDetails.bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Code*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., SBIN0001234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account holder name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type*</FormLabel>
                        <div className="relative">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="savings">
                                Savings Account
                              </SelectItem>
                              <SelectItem value="current">
                                Current Account
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Email Verified</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Is Verified</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" asChild>
                  <Link prefetch href="/admin/vendors">
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand/90">
                  Add Vendor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddVendorAdminForm;
