"use client";
import React, { useState, useEffect } from "react";
import {
  Link,
  Plus,
  Trash2,
  Edit,
  Search,
  Copy,
  ExternalLink,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { getAllParentCategory } from "@/lib/actions/parentCategory.actions";
import { toast } from "@/hooks/use-toast";
import { IParentCategory, IReferral } from "@/types";
import Loader from "@/components/Loader";
import { referralFormSchema } from "@/lib/validations";

const ReferralsPage = () => {
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [referrals, setReferrals] = useState<IReferral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReferral, setEditingReferral] = useState<IReferral | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  // Initialize form
  const form = useForm<z.infer<typeof referralFormSchema>>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      name: "",
      description: "",
      vendorId: "",
      discountType: "percentage",
      discountValue: 0,
      parentCategoryId: "",
      expiryDate: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      maxUses: 100,
      isActive: true,
    },
  });

  // Load parent categories and referrals
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set base URL for referral links
        setBaseUrl(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/`);

        // Fetch parent categories
        const categoriesResponse = await getAllParentCategory();
        if (categoriesResponse.success && categoriesResponse.data) {
          setParentCategories(categoriesResponse.data as IParentCategory[]);
        }

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
        discountValue: Number(values.discountValue),
        maxUses: Number(values.maxUses),
        parentCategory: values.parentCategoryId,
        parentCategoryId: undefined,
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
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Something went wrong",
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
      discountType: referral.discountType,
      discountValue: referral.discountValue,
      parentCategoryId: referral.parentCategory._id,
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
        setReferrals(referrals.filter((referral) => referral._id !== id));

        toast({
          title: "Success",
          description: "Referral deleted successfully",
        });
      } else {
        throw new Error(result.error || "Delete operation failed");
      }
    } catch (error) {
      console.error("Error deleting referral:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete referral",
        variant: "destructive",
      });
    }
  };

  // Filter referrals based on search term
  const filteredReferrals = referrals.filter((referral) => {
    return (
      searchTerm === "" ||
      referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.parentCategory.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
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
          <Link className="text-brand" size={30} />
          <h1 className="text-2xl font-bold">Referral System</h1>
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
                  discountType: "percentage",
                  discountValue: 0,
                  parentCategoryId: "",
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
                  : "Fill in the details for your new category referral discount."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Spring Referral Campaign"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Referral program details..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage (%)
                            </SelectItem>
                            <SelectItem value="amount">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={
                              form.watch("discountType") === "percentage"
                                ? "10"
                                : "50"
                            }
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="parentCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parentCategories.map((category) => (
                            <SelectItem
                              key={category._id}
                              value={category._id}
                              disabled={!category.isActive}
                            >
                              {category.name}{" "}
                              {!category.isActive && "(Inactive)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxUses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Uses</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Is this referral currently active?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="primary-btn"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingReferral
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Referral Links</CardTitle>
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
            Create and manage referral links that offer discounts on specific
            product categories.
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
                    <TableHead>Discount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
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
                        {referral.discountValue}
                        {referral.discountType === "percentage" ? "%" : ""}
                      </TableCell>
                      <TableCell>{referral.parentCategory.name}</TableCell>
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
