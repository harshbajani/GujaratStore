"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBusinessIdentity,
  updateBusinessIdentity,
  getBusinessIdentity,
} from "@/lib/actions/businessIdentity.actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BriefcaseBusiness, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { businessIdentityFormSchema } from "@/lib/validations";

type IdentityFormValues = z.infer<typeof businessIdentityFormSchema>;

const BusinessIdentityVerificationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(businessIdentityFormSchema),
    defaultValues: {
      MSMECertificate: "",
      UdhyamAadhar: "",
      Fassai: "",
      CorporationCertificate: "",
      OtherDocuments: "",
    },
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getBusinessIdentity();
        if (result.success && result.data) {
          form.reset({
            MSMECertificate: result.data.MSMECertificate || "",
            UdhyamAadhar: result.data.UdhyamAadhar || "",
            Fassai: result.data.Fassai || "",
            CorporationCertificate: result.data.CorporationCertificate || "",
            OtherDocuments: result.data.OtherDocuments || "",
          });
        }
      } catch (error) {
        console.error("Error loading business identity:", error);
      }
    };

    loadData();
  }, [form]);

  // Upload file helper function
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `File upload failed: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    return result.fileId;
  };

  const onSubmit = async (values: IdentityFormValues) => {
    setIsLoading(true);
    try {
      let MSMECertificateId: string = "";
      let UdhyamAadharId: string = "";
      let FassaiId: string = "";
      let CorporationCertificateId: string = "";
      let OtherDocumentsId: string = "";

      // Handle MSME Certificate
      if (typeof values.MSMECertificate === "string") {
        MSMECertificateId = values.MSMECertificate;
      } else if (
        values.MSMECertificate &&
        typeof values.MSMECertificate === "object" &&
        "name" in values.MSMECertificate
      ) {
        MSMECertificateId = await uploadFile(values.MSMECertificate as File);
      }

      // Handle Udhyam Aadhar
      if (typeof values.UdhyamAadhar === "string") {
        UdhyamAadharId = values.UdhyamAadhar;
      } else if (
        values.UdhyamAadhar &&
        typeof values.UdhyamAadhar === "object" &&
        "name" in values.UdhyamAadhar
      ) {
        UdhyamAadharId = await uploadFile(values.UdhyamAadhar as File);
      }

      // Handle Fassai
      if (typeof values.Fassai === "string") {
        FassaiId = values.Fassai;
      } else if (
        values.Fassai &&
        typeof values.Fassai === "object" &&
        "name" in values.Fassai
      ) {
        FassaiId = await uploadFile(values.Fassai as File);
      }

      // Handle Corporation Certificate
      if (typeof values.CorporationCertificate === "string") {
        CorporationCertificateId = values.CorporationCertificate;
      } else if (
        values.CorporationCertificate &&
        typeof values.CorporationCertificate === "object" &&
        "name" in values.CorporationCertificate
      ) {
        CorporationCertificateId = await uploadFile(
          values.CorporationCertificate as File
        );
      }

      // Handle Other Documents
      if (typeof values.OtherDocuments === "string") {
        OtherDocumentsId = values.OtherDocuments;
      } else if (
        values.OtherDocuments &&
        typeof values.OtherDocuments === "object" &&
        "name" in values.OtherDocuments
      ) {
        OtherDocumentsId = await uploadFile(values.OtherDocuments as File);
      }

      const payload = {
        MSMECertificate: MSMECertificateId,
        UdhyamAadhar: UdhyamAadharId,
        Fassai: FassaiId,
        CorporationCertificate: CorporationCertificateId,
        OtherDocuments: OtherDocumentsId,
      };

      // Check if business identity already exists to determine create vs update
      const existingData = await getBusinessIdentity();
      const result =
        existingData.success && existingData.data
          ? await updateBusinessIdentity(payload)
          : await createBusinessIdentity(payload);

      if (result.success) {
        toast({
          title: "Success",
          description: "Business identity information saved successfully!",
        });
        // Optionally reset form or refetch data here
      } else {
        throw new Error(
          result.error || "Failed to save business identity information"
        );
      }
    } catch (error) {
      console.error("Error saving business identity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save business identity information",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-brand/5 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-playfair">
                  Bussiness Identity
                </CardTitle>
                <CardDescription className="mt-2">
                  Fill your details to verify your business&apos;s identity
                </CardDescription>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <BriefcaseBusiness className="w-6 h-6 text-brand" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* MSME and Udhyam aadhar Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="MSMECertificate"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload MSME Certificate</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          {value && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Upload className="w-4 h-4" />
                              <span>
                                {value &&
                                typeof value === "object" &&
                                "name" in value
                                  ? (value as File).name
                                  : "Document uploaded"}
                              </span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="UdhyamAadhar"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Udhyam Aadhar Certificate</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          {value && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Upload className="w-4 h-4" />
                              <span>
                                {value &&
                                typeof value === "object" &&
                                "name" in value
                                  ? (value as File).name
                                  : "Document uploaded"}
                              </span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="OtherDocuments"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>
                        Upload any document related to your business
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          {value && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Upload className="w-4 h-4" />
                              <span>
                                {value &&
                                typeof value === "object" &&
                                "name" in value
                                  ? (value as File).name
                                  : "Document uploaded"}
                              </span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fassai and Corporation Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="Fassai"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Fassai Document</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          {value && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Upload className="w-4 h-4" />
                              <span>
                                {value &&
                                typeof value === "object" &&
                                "name" in value
                                  ? (value as File).name
                                  : "Document uploaded"}
                              </span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="CorporationCertificate"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Corporation Certificate</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          {value && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Upload className="w-4 h-4" />
                              <span>
                                {value &&
                                typeof value === "object" &&
                                "name" in value
                                  ? (value as File).name
                                  : "Document uploaded"}
                              </span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <Button
                type="submit"
                className="bg-brand hover:bg-brand/90"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default BusinessIdentityVerificationForm;
