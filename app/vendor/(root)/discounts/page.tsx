"use client";
import React, { useState, useEffect } from "react";
import {
  Percent,
  Plus,
  Trash2,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { getAllParentCategory } from "@/lib/actions/parentCategory.actions";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { discountFormSchema } from "@/lib/validations";
import { useDiscounts } from "@/hooks/useDiscounts";

const DiscountsPage = () => {
  // Use the custom hook for server-side operations
  const {
    discounts,
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
    createDiscount,
    updateDiscount,
    deleteDiscount,
  } = useDiscounts({
    initialPage: 1,
    initialLimit: 10,
    apiBasePath: "/api/vendor/discounts",
  });

  // Component-specific states
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<IDiscount | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDiscountId, setDeletingDiscountId] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: "",
      vendorId: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      parentCategoryId: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      isActive: true,
    },
  });

  // Load parent categories and initialize vendor ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parent categories
        const categoriesResponse = await getAllParentCategory();
        if (categoriesResponse.success && categoriesResponse.data) {
          setParentCategories(categoriesResponse.data as IParentCategory[]);
        }

        // Fetch vendor info and set vendorId
        const userResponse = await fetch("/api/vendor/current");
        const userData = await userResponse.json();
        if (userData.success && userData.data && userData.data._id) {
          form.setValue("vendorId", userData.data._id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [form]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit: string) => {
    onLimitChange(parseInt(newLimit));
  };

  // Handle sort change
  const handleSort = (field: keyof IDiscount) => {
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

  const onSubmit = async (values: z.infer<typeof discountFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Create the payload with the correct structure
      const payload: Partial<IDiscount> = {
        name: values.name,
        description: values.description,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        vendorId: values.vendorId,
        isActive: values.isActive,
        discountType: values.discountType as DiscountType,
        discountValue: Number(values.discountValue),
        targetType: "category",
        // Send parentCategoryId for the API to handle
        parentCategoryId: values.parentCategoryId,
      };

      if (editingDiscount) {
        await updateDiscount(editingDiscount._id, payload);
        refetch();
      } else {
        await createDiscount(payload);
        refetch();
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingDiscount(null);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Also fix the handleEditDiscount function to handle the parentCategory properly
  const handleEditDiscount = (discount: IDiscount) => {
    setEditingDiscount(discount);
    form.reset({
      name: discount.name,
      vendorId: form.getValues("vendorId"),
      description: discount.description || "",
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      // Handle both string and object parentCategory
      parentCategoryId:
        typeof discount.parentCategory === "string"
          ? discount.parentCategory
          : discount.parentCategory._id,
      startDate: new Date(discount.startDate).toISOString().split("T")[0],
      endDate: new Date(discount.endDate).toISOString().split("T")[0],
      isActive: discount.isActive,
    });
    setIsDialogOpen(true);
  };

  // Handle delete discount
  const handleDeleteDiscount = (id: string) => {
    setDeletingDiscountId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingDiscountId) return;

    try {
      await deleteDiscount(deletingDiscountId);
      refetch();
    } catch (error) {
      console.error("Error deleting discount:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingDiscountId(null);
    }
  };

  // Pagination component
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
          <Percent className="text-brand" size={30} />
          <h1 className="text-2xl font-bold">Discounts</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingDiscount(null);
                form.reset({
                  name: "",
                  description: "",
                  vendorId: form.getValues("vendorId"),
                  discountType: "percentage",
                  discountValue: 0,
                  parentCategoryId: "",
                  startDate: format(new Date(), "yyyy-MM-dd"),
                  endDate: format(
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    "yyyy-MM-dd"
                  ),
                  isActive: true,
                });
              }}
              className="primary-btn"
            >
              <Plus className="mr-2" /> Add Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? "Edit Discount" : "Create New Discount"}
              </DialogTitle>
              <DialogDescription>
                {editingDiscount
                  ? "Update the discount details below."
                  : "Fill in the details for your new category discount."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Input type="hidden" {...form.register("vendorId")} />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Sale" {...field} />
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
                          placeholder="Discount details..."
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
                      <FormLabel>Parent Category</FormLabel>
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          Is this discount currently active?
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
                      : editingDiscount
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
            <CardTitle>Manage Category Discounts</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discounts..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <CardDescription>
            Create and manage discounts for product categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : discounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No discounts found matching your search."
                  : "No discounts found."}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2" /> Create your first discount
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
                        className="w-[250px] cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Name</span>
                          {getSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("discountType")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Type</span>
                          {getSortIcon("discountType")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("discountValue")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Value</span>
                          {getSortIcon("discountValue")}
                        </div>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("endDate")}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Valid Until</span>
                          {getSortIcon("endDate")}
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
                    {discounts.map((discount) => (
                      <TableRow key={discount._id}>
                        <TableCell className="font-medium">
                          {discount.name}
                          {discount.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {discount.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {discount.discountType === "percentage"
                            ? "Percentage"
                            : "Fixed Amount"}
                        </TableCell>
                        <TableCell>
                          {discount.discountValue}
                          {discount.discountType === "percentage" ? "%" : ""}
                        </TableCell>
                        <TableCell>{discount.parentCategory.name}</TableCell>
                        <TableCell>
                          {new Date(discount.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              discount.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {discount.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDiscount(discount)}
                              title="Edit discount"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDiscount(discount._id)}
                              title="Delete discount"
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              discount and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDiscountId(null)}>
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

export default withVendorProtection(DiscountsPage);
