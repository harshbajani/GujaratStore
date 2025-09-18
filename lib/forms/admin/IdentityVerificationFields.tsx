/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IdCard, Upload } from "lucide-react";

interface IdentityVerificationFieldsProps {
  form: UseFormReturn<any>;
  namePrefix?: string;
  showTitle?: boolean;
  className?: string;
}

const IdentityVerificationFields: React.FC<IdentityVerificationFieldsProps> = ({
  form,
  namePrefix = "",
  showTitle = true,
  className = "",
}) => {
  const getFieldName = (fieldName: string) => {
    return namePrefix ? `${namePrefix}.${fieldName}` : fieldName;
  };

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <IdCard className="w-5 h-5 text-brand" />
            Identity Verification
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Provide identity documents for verification
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Aadhar Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={getFieldName("aadharCardNumber")}
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
            name={getFieldName("aadharCardDoc")}
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
                          {value && typeof value === "object" && "name" in value
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
            name={getFieldName("panCard")}
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
            name={getFieldName("panCardDoc")}
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
                          {value && typeof value === "object" && "name" in value
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
    </div>
  );
};

export default IdentityVerificationFields;
