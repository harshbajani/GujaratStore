"use client";

import { ShoppingCart } from "lucide-react";
import { withVendorProtection } from "@/app/vendor/HOC";
import React, { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  PaginationState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import { IProduct, ProductWithPopulatedFields } from "@/types";

const ProductsPage = () => {
  // * useStates and hooks
  const [data, setData] = useState<ProductWithPopulatedFields[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const router = useRouter();
  const { toast } = useToast();
  // * fetch all products
  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products`);
      const { data } = await response.json(); // Destructure data from response
      setData(
        data.map((product: IProduct) => ({
          ...product,
          id: product._id, // Convert MongoDB _id to id
          productStatus: product.productStatus ?? true,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // * delete products
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/products?id=${id}`, {
        method: "DELETE", // Add DELETE method
      });
      await fetchAllProducts();
      toast({
        title: "Success",
        description: "Product deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const columns: ColumnDef<ProductWithPopulatedFields>[] = [
    {
      accessorKey: "productName",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("productName")}</div>
      ),
    },
    {
      accessorKey: "parentCategory",
      header: "Parent Category",
      cell: ({ row }) => (
        <div>{row.original.parentCategory?.name || "N/A"}</div>
      ),
    },
    {
      accessorKey: "primaryCategory",
      header: "Primary Category",
      cell: ({ row }) => (
        <div>{row.original.primaryCategory?.name || "N/A"}</div>
      ),
    },
    {
      accessorKey: "secondaryCategory",
      header: "Secondary Category",
      cell: ({ row }) => (
        <div>{row.original.secondaryCategory?.name || "N/A"}</div>
      ),
    },
    {
      accessorKey: "brands",
      header: "Brand",
      cell: ({ row }) => <div>{row.original.brands?.name || "N/A"}</div>,
    },
    {
      accessorKey: "productDescription",
      header: "Description",
      cell: ({ row }) => (
        <div className="truncate max-w-[200px]">
          {row.getValue("productDescription") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "productStatus",
      header: "Product Status",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("productStatus") ? "default" : "secondary"}
          className={
            row.getValue("productStatus")
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {row.getValue("productStatus") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() => router.push(`/vendor/products/edit/${product.id}`)}
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-100"
              onClick={() => handleDelete(product.id!)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-brand" size={30} />
        <h1 className="h1">Products</h1>
      </div>
      <div className="p-2 bg-white border rounded-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Input
              placeholder="Filter by product name..."
              value={
                (table.getColumn("productName")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("productName")
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Link href="/vendor/products/add">
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Add Product
              </Button>
            </Link>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="bg-gray-50">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => {
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(value),
                  });
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {pageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(pageNumber - 1)}
                    className={
                      currentPage === pageNumber
                        ? "bg-brand hover:bg-brand/90 text-white"
                        : ""
                    }
                  >
                    {pageNumber}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withVendorProtection(ProductsPage);
