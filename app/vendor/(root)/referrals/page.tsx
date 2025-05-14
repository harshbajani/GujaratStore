/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Copy,
  ExternalLink,
  GiftIcon,
} from "lucide-react";
import { withVendorProtection } from "../../HOC";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { IReferral } from "@/types";
import Loader from "@/components/Loader";
import ReferralForm from "@/lib/forms/referral/ReferralForm";

// Updated schema for the new reward points system
const referralFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  vendorId: z.string(),
  rewardPoints: z.number().min(1, "Reward points must be at least 1"),
  expiryDate: z.string(),
  maxUses: z.number().min(1, "Maximum uses must be at least 1"),
  isActive: z.boolean().default(true),
});

const ReferralsPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReferral, setEditingReferral] = useState<IReferral | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  // Initialize form
  const form = useForm({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      name: "",
      description: "",
      vendorId: "",
      rewardPoints: 100, // Default to 100 reward points
      expiryDate: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      maxUses: 100,
      isActive: true,
    },
  });

  // Load referrals
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set base URL for referral links
        setBaseUrl(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/`);

        // Fetch referrals
        const referralsResponse = await fetch("/api/referrals");
        const referralsData = await referralsResponse.json();
        if (referralsData.success) {
          setReferrals(referralsData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof referralFormSchema>) => {
    setIsSubmitting(true);
    try {
      const endpoint = "/api/referrals";
      const method = editingReferral ? "PUT" : "POST";

      const payload = {
        ...values,
        rewardPoints: Number(values.rewardPoints),
        maxUses: Number(values.maxUses),
        ...(editingReferral && { _id: editingReferral._id }),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh referrals list
        const referralsResponse = await fetch("/api/referrals");
        const referralsData = await referralsResponse.json();
        if (referralsData.success) {
          setReferrals(referralsData.data);
        }

        toast({
          title: "Success",
          description: editingReferral
            ? "Referral updated successfully"
            : "Referral created successfully",
        });

        // Close dialog and reset form
        setIsDialogOpen(false);
        setEditingReferral(null);
        form.reset();
      } else {
        throw new Error(result.error || "Operation failed");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle copy referral link
  const handleCopyReferralLink = (code: string) => {
    const referralLink = `${baseUrl}${code}/sign-up`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Success",
      description: "Referral link copied to clipboard",
    });
  };

  // Handle edit referral
  const handleEditReferral = (referral: IReferral) => {
    setEditingReferral(referral);
    form.reset({
      name: referral.name,
      description: referral.description || "",
      vendorId: form.getValues("vendorId"),
      rewardPoints: referral.rewardPoints,
      expiryDate: new Date(referral.expiryDate).toISOString().split("T")[0],
      maxUses: referral.maxUses,
      isActive: referral.isActive,
    });
    setIsDialogOpen(true);
  };

  // Handle delete referral
  const handleDeleteReferral = async (id: string) => {
    if (!confirm("Are you sure you want to delete this referral?")) {
      return;
    }

    try {
      const response = await fetch(`/api/referrals?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setReferrals(
          referrals.filter((referral: IReferral) => referral._id !== id)
        );

        toast({
          title: "Success",
          description: "Referral deleted successfully",
        });
      } else {
        throw new Error(result.error || "Delete operation failed");
      }
    } catch (error: any) {
      console.error("Error deleting referral:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete referral",
        variant: "destructive",
      });
    }
  };

  // Filter referrals based on search term
  const filteredReferrals = referrals.filter((referral: IReferral) => {
    return (
      searchTerm === "" ||
      referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const userResponse = await fetch("/api/vendor/current");
        const userData = await userResponse.json();
        if (userData.success && userData.data && userData.data._id) {
          // Set the vendorId in the form state
          form.setValue("vendorId", userData.data._id);
          console.log("Vendor ID set:", userData.data._id);
        } else {
          console.error("Failed to get vendor ID from response", userData);
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
      }
    };
    fetchVendor();
  }, [form]);

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GiftIcon className="text-brand" size={30} />
          <h1 className="text-2xl font-bold">Reward Points Referral System</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingReferral(null);
                form.reset({
                  name: "",
                  description: "",
                  vendorId: form.getValues("vendorId"),
                  rewardPoints: 100,
                  expiryDate: format(
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    "yyyy-MM-dd"
                  ),
                  maxUses: 100,
                  isActive: true,
                });
              }}
              className="primary-btn"
            >
              <Plus className="mr-2" /> Create Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingReferral ? "Edit Referral" : "Create New Referral"}
              </DialogTitle>
              <DialogDescription>
                {editingReferral
                  ? "Update the referral details below."
                  : "Create a referral link that will award reward points to new users who sign up."}
              </DialogDescription>
            </DialogHeader>
            <ReferralForm
              onSubmit={onSubmit}
              editingReferral={editingReferral}
              isSubmitting={isSubmitting}
              vendorId={form.getValues("vendorId")}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Reward Point Referrals</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search referrals..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Create and manage referral links that award reward points to new
            users. Users can redeem these points at checkout (10 points = ₹1
            discount).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No referrals found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-2" /> Create your first referral
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Reward Points</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral: IReferral) => (
                    <TableRow key={referral._id}>
                      <TableCell className="font-medium">
                        {referral.name}
                        {referral.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {referral.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {referral.code}
                      </TableCell>
                      <TableCell>
                        {referral.rewardPoints} points
                        <p className="text-xs text-muted-foreground">
                          (₹{Math.floor(referral.rewardPoints / 10)} value)
                        </p>
                      </TableCell>
                      <TableCell>
                        {referral.usedCount}/{referral.maxUses}
                      </TableCell>
                      <TableCell>
                        {new Date(referral.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            referral.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {referral.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleCopyReferralLink(referral.code)
                            }
                            title="Copy referral link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              window.open(
                                `${baseUrl}${referral.code}/sign-up`,
                                "_blank"
                              )
                            }
                            title="Open referral link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditReferral(referral)}
                            title="Edit referral"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReferral(referral._id)}
                            title="Delete referral"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withVendorProtection(ReferralsPage);
