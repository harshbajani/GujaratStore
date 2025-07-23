/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Copy,
  ExternalLink,
  GiftIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { IReferral } from "@/types";
import Loader from "@/components/Loader";
import ReferralForm from "@/lib/forms/admin/referral/ReferralForm";
import { useReferrals } from "@/hooks/useReferrals";

// Updated schema for the new reward points system
const referralFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  rewardPoints: z.number().min(1, "Reward points must be at least 1"),
  expiryDate: z.string(),
  maxUses: z.number().min(1, "Maximum uses must be at least 1"),
  isActive: z.boolean().default(true),
});

const ReferralsPage = () => {
  const {
    referrals,
    pagination,
    isLoading,
    searchTerm,
    sortBy,
    sortOrder,
    onSearchChange,
    onPageChange,
    onLimitChange,
    onSortChange,
    refetch,
    createReferral,
    deleteReferral,
  } = useReferrals({
    initialPage: 1,
    initialLimit: 10,
    apiBasePath: "/api/admin/referrals",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReferral, setEditingReferral] = useState<IReferral | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingReferralId, setDeletingReferralId] = useState<string | null>(
    null
  );

  // Initialize form
  const form = useForm({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      name: "",
      description: "",
      rewardPoints: 100,
      expiryDate: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      maxUses: 100,
      isActive: true,
    },
  });

  // Set base URL on component mount
  React.useEffect(() => {
    setBaseUrl(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/`);
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit: string) => {
    onLimitChange(parseInt(newLimit));
  };

  // Handle sort change
  const handleSort = (field: keyof IReferral) => {
    onSortChange(field);
  };

  // Get sort icon for table headers
  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "desc" ? (
      <ArrowDown className="h-4 w-4" />
    ) : (
      <ArrowUp className="h-4 w-4" />
    );
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof referralFormSchema>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        rewardPoints: Number(values.rewardPoints),
        maxUses: Number(values.maxUses),
        ...(editingReferral && { _id: editingReferral._id }),
      };

      if (editingReferral) {
        // still do your PUT + refetch for updates
        await fetch("/api/admin/referrals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, _id: editingReferral._id }),
        })
          .then((r) => r.json())
          .then((j) => {
            if (!j.success) throw new Error(j.error);
            refetch();
          });
      } else {
        // use our helper for creates
        await createReferral(payload);
      }

      toast({
        title: "Success",
        description: editingReferral
          ? "Referral updated successfully"
          : "Referral created successfully",
      });

      setIsDialogOpen(false);
      setEditingReferral(null);
      form.reset();
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
      rewardPoints: referral.rewardPoints,
      expiryDate: new Date(referral.expiryDate).toISOString().split("T")[0],
      maxUses: referral.maxUses,
      isActive: referral.isActive,
    });
    setIsDialogOpen(true);
  };

  // Handle delete referral
  const handleDeleteReferral = (id: string) => {
    setDeletingReferralId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingReferralId) return;

    try {
      await deleteReferral(deletingReferralId);
      toast({
        title: "Success",
        description: "Referral deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete referral",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingReferralId(null);
    }
  };

  // Pagination component - matching vendor UI
  const PaginationComponent = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
          to{" "}
          {Math.min(
            pagination.currentPage * pagination.itemsPerPage,
            pagination.totalItems
          )}{" "}
          of {pagination.totalItems} results
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows per page:</p>
          <Select
            value={pagination.itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

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
                onChange={handleSearchChange}
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
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No referrals found matching your search."
                  : "No referrals found."}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2" /> Create your first referral
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="w-[200px] cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Name</span>
                          {getSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("code")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Referral Code</span>
                          {getSortIcon("code")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("rewardPoints")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Reward Points</span>
                          {getSortIcon("rewardPoints")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("usedCount")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Uses</span>
                          {getSortIcon("usedCount")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("expiryDate")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Expires</span>
                          {getSortIcon("expiryDate")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("isActive")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Status</span>
                          {getSortIcon("isActive")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral: IReferral) => (
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

              <PaginationComponent />
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              referral and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingReferralId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="primary-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReferralsPage;
