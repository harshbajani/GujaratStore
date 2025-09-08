"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVendorIdentity,
  updateVendorIdentity,
  getVendorIdentity,
} from "@/lib/actions/vendorIdentity.actions";
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
import { IdCard, Upload } from "lucide-react";
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
const vendorIdentityFormSchema = z.object({
  aadharCardNumber: z
    .string()
    .min(12, "Aadhar number must be 12 digits")
    .max(12, "Aadhar number must be 12 digits"),
  aadharCardDoc: z
    .union([z.string(), z.instanceof(File)])
    .refine(
      (val) => val !== null && val !== undefined && val !== "",
      "Aadhar card document is required"
    ),
  panCard: z
    .string()
    .min(10, "PAN number must be 10 characters")
    .max(10, "PAN number must be 10 characters"),
  panCardDoc: z
    .union([z.string(), z.instanceof(File)])
    .refine(
      (val) => val !== null && val !== undefined && val !== "",
      "PAN card document is required"
    ),
});

type IdentityFormValues = z.infer<typeof vendorIdentityFormSchema>;

const VendorIdentityVerificationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(vendorIdentityFormSchema),
    defaultValues: {
      aadharCardNumber: "",
      aadharCardDoc: "",
      panCard: "",
      panCardDoc: "",
    },
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getVendorIdentity();
        if (result.success && result.data) {
          form.reset({
            aadharCardNumber: result.data.aadharCardNumber || "",
            aadharCardDoc: result.data.aadharCardDoc || "",
            panCard: result.data.panCard || "",
            panCardDoc: result.data.panCardDoc || "",
          });
        }
      } catch (error) {
        console.error("Error loading vendor identity:", error);
      } finally {
        setIsLoadingData(false);
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
      let aadharCardDocId: string = "";
      let panCardDocId: string = "";

      // Handle existing string values or upload new files
      if (typeof values.aadharCardDoc === "string") {
        aadharCardDocId = values.aadharCardDoc;
      } else if (
        values.aadharCardDoc &&
        typeof values.aadharCardDoc === "object" &&
        "name" in values.aadharCardDoc
      ) {
        aadharCardDocId = await uploadFile(values.aadharCardDoc as File);
      }

      if (typeof values.panCardDoc === "string") {
        panCardDocId = values.panCardDoc;
      } else if (
        values.panCardDoc &&
        typeof values.panCardDoc === "object" &&
        "name" in values.panCardDoc
      ) {
        panCardDocId = await uploadFile(values.panCardDoc as File);
      }

      const payload = {
        aadharCardNumber: values.aadharCardNumber,
        aadharCardDoc: aadharCardDocId,
        panCard: values.panCard,
        panCardDoc: panCardDocId,
      };

      // Check if identity already exists to determine create vs update
      const existingData = await getVendorIdentity();
      const result =
        existingData.success && existingData.data
          ? await updateVendorIdentity(payload)
          : await createVendorIdentity(payload);

      if (result.success) {
        toast({
          title: "Success",
          description: "Vendor identity information saved successfully!",
        });
      } else {
        throw new Error(result.error || "Failed to save identity information");
      }
    } catch (error) {
      console.error("Error saving vendor identity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save identity information",
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
                  Vendor Identity
                </CardTitle>
                <CardDescription className="mt-2">
                  Fill your details to verify your identity
                </CardDescription>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <IdCard className="w-6 h-6 text-brand" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Aadhar Section */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="aadharCardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Card Number</FormLabel>
                        <div className="relative flex items-center">
                          <IdCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-muted/50 pl-10"
                              maxLength={12}
                              placeholder="Enter 12-digit Aadhar number"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aadharCardDoc"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Upload Aadhar Card Document</FormLabel>
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

                {/* PAN Section */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="panCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Card Number</FormLabel>
                        <div className="relative flex items-center">
                          <IdCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-muted/50 pl-10 uppercase"
                              maxLength={10}
                              placeholder="Enter 10-character PAN number"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panCardDoc"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Upload PAN Card Document</FormLabel>
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
            )}
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

export default VendorIdentityVerificationForm;
