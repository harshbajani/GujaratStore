"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateVendorBankDetails } from "@/lib/actions/bank.actions";
import { useVendorDetails } from "@/hooks/useVendorDetails";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CreditCard, Building2, User, FileText, Hash } from "lucide-react";

const bankDetailsSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  bankCode: z.string().min(2, "Bank code is required"),
  ifscCode: z
    .string()
    .min(11, "IFSC code must be 11 characters")
    .max(11, "IFSC code must be 11 characters")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(8, "Account number must be at least 8 digits"),
  accountType: z.enum(["savings", "current"], {
    required_error: "Account type is required",
  }),
});

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

const BankDetailsForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const { toast } = useToast();
  const { user, refetch } = useVendorDetails();

  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: "",
      bankCode: "",
      ifscCode: "",
      accountHolderName: "",
      accountNumber: "",
      accountType: "savings",
    },
  });

  // Fetch banks on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch("/api/banks");
        const result = await response.json();

        if (result.success && result.data) {
          setBanks(result.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch banks",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching banks:", error);
        toast({
          title: "Error",
          description: "Failed to fetch banks",
          variant: "destructive",
        });
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [toast]);

  // Update form values when user data is available
  useEffect(() => {
    if (user?.bankDetails) {
      form.reset({
        bankName: user.bankDetails.bankName || "",
        bankCode: user.bankDetails.bankCode || "",
        ifscCode: user.bankDetails.ifscCode || "",
        accountHolderName: user.bankDetails.accountHolderName || "",
        accountNumber: user.bankDetails.accountNumber || "",
        accountType: user.bankDetails.accountType || "savings",
      });
    }
  }, [user, form]);

  // Handle bank selection
  const handleBankSelect = (bankCode: string) => {
    const selectedBank = banks.find((bank) => bank.bankCode === bankCode);
    if (selectedBank) {
      form.setValue("bankName", selectedBank.bankName);
      form.setValue("bankCode", selectedBank.bankCode);

      // Auto-populate IFSC prefix if empty
      const currentIfsc = form.getValues("ifscCode");
      if (!currentIfsc || currentIfsc.length === 0) {
        form.setValue("ifscCode", selectedBank.ifscPrefix + "0");
      }
    }
  };

  const onSubmit = async (values: BankDetailsFormValues) => {
    setIsLoading(true);
    try {
      const updates: Partial<BankDetailsFormValues> = {};
      const currentBankDetails = user?.bankDetails;

      // Check what has changed
      if (values.bankName !== currentBankDetails?.bankName)
        updates.bankName = values.bankName;
      if (values.bankCode !== currentBankDetails?.bankCode)
        updates.bankCode = values.bankCode;
      if (values.ifscCode !== currentBankDetails?.ifscCode)
        updates.ifscCode = values.ifscCode;
      if (values.accountHolderName !== currentBankDetails?.accountHolderName)
        updates.accountHolderName = values.accountHolderName;
      if (values.accountNumber !== currentBankDetails?.accountNumber)
        updates.accountNumber = values.accountNumber;
      if (values.accountType !== currentBankDetails?.accountType)
        updates.accountType = values.accountType;

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your bank details",
        });
        setIsLoading(false);
        return;
      }

      const result = await updateVendorBankDetails(values as BankDetails);

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: "Bank details updated successfully",
        });

        // Trigger refetch to update vendor details globally
        await refetch();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update bank details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
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
                  Bank Details
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage your banking information for payments
                </CardDescription>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-brand" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Bank Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name*</FormLabel>
                      <div className="relative">
                        <Building2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleBankSelect(value);
                          }}
                          value={field.value}
                          disabled={loadingBanks}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-muted/50 pl-10">
                              <SelectValue
                                placeholder={
                                  loadingBanks
                                    ? "Loading banks..."
                                    : "Select a bank"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem
                                key={bank.bankCode}
                                value={bank.bankCode}
                              >
                                {bank.bankName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code*</FormLabel>
                      <div className="relative">
                        <Hash className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-muted/50 pl-10 uppercase"
                            placeholder="e.g., SBIN0001234"
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type*</FormLabel>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-muted/50 pl-10">
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

              {/* Account Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name*</FormLabel>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-muted/50 pl-10"
                            placeholder="Enter account holder name"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number*</FormLabel>
                      <div className="relative">
                        <Hash className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-muted/50 pl-10"
                            placeholder="Enter account number"
                            type="text"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hidden bank name field for form validation */}
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                disabled={isLoading || loadingBanks}
              >
                {isLoading ? "Saving..." : "Save Bank Details"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default BankDetailsForm;
