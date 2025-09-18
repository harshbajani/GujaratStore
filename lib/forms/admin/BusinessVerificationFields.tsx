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
import { BriefcaseBusiness, Upload } from "lucide-react";

interface BusinessVerificationFieldsProps {
  form: UseFormReturn<any>;
  namePrefix?: string;
  showTitle?: boolean;
  className?: string;
}

const BusinessVerificationFields: React.FC<BusinessVerificationFieldsProps> = ({
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
            <BriefcaseBusiness className="w-5 h-5 text-brand" />
            Business Verification
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Provide business documents for verification (optional)
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* MSME and Udhyam Aadhar Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={getFieldName("MSMECertificate")}
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
          <FormField
            control={form.control}
            name={getFieldName("UdhyamAadhar")}
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
          <FormField
            control={form.control}
            name={getFieldName("OtherDocuments")}
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

        {/* FSSAI and Corporation Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={getFieldName("Fassai")}
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Upload FSSAI Document</FormLabel>
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
          <FormField
            control={form.control}
            name={getFieldName("CorporationCertificate")}
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

export default BusinessVerificationFields;
