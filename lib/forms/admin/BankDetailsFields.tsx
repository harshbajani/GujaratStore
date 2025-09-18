/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Building2, User, FileText, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BankDetailsFieldsProps {
  form: UseFormReturn<any>;
  namePrefix?: string;
  showTitle?: boolean;
  className?: string;
}

const BankDetailsFields: React.FC<BankDetailsFieldsProps> = ({
  form,
  namePrefix = "",
  showTitle = true,
  className = "",
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const { toast } = useToast();

  const getFieldName = (fieldName: string) => {
    return namePrefix ? `${namePrefix}.${fieldName}` : fieldName;
  };

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

  // Handle bank selection
  const handleBankSelect = (bankCode: string) => {
    const selectedBank = banks.find((bank) => bank.bankCode === bankCode);
    if (selectedBank) {
      form.setValue(getFieldName("bankName"), selectedBank.bankName);
      form.setValue(getFieldName("bankCode"), selectedBank.bankCode);

      // Auto-populate IFSC prefix if empty
      const currentIfsc = form.getValues(getFieldName("ifscCode"));
      if (!currentIfsc || currentIfsc.length === 0) {
        form.setValue(getFieldName("ifscCode"), selectedBank.ifscPrefix + "0");
      }
    }
  };

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" />
            Bank Details
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Banking information for payments
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Bank Information */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={getFieldName("bankCode")}
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
                            loadingBanks ? "Loading banks..." : "Select a bank"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.bankCode} value={bank.bankCode}>
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
            name={getFieldName("ifscCode")}
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
            name={getFieldName("accountType")}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type*</FormLabel>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-muted/50 pl-10">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="current">Current Account</SelectItem>
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
            name={getFieldName("accountHolderName")}
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
            name={getFieldName("accountNumber")}
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
            name={getFieldName("bankName")}
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
    </div>
  );
};

export default BankDetailsFields;
