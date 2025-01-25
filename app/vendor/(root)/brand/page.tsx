"use client";
import { Star } from "lucide-react";
import { withVendorProtection } from "../../HOC";
import Loader from "@/components/Loader";
import { IBrand } from "@/types";
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
import { deleteBrand, getAllBrands } from "@/lib/actions/brand.actions";

const BrandPage = () => {
  const [data, setData] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const router = useRouter();
  const { toast } = useToast();

  const fetchBrands = async () => {
    try {
      const response = await getAllBrands();
      setData(response);
    } catch (error) {
      console.error("Failed to fetch brands data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch brands data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBrand(id);
      await fetchBrands();
      toast({
        title: "Success",
        description: "Brand data deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete brand data:", error);
      toast({
        title: "Error",
        description: "Failed to delete brand data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const columns: ColumnDef<IBrand>[] = [
    {
      accessorKey: "name",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "metaTitle",
      header: "Meta Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("metaTitle")}</div>
      ),
    },
    {
      accessorKey: "metaKeywords",
      header: "Meta Keywords",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("metaKeywords")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const brand = row.original;
        console.log(brand._id);
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() => router.push(`/vendor/brand/edit/${brand._id}`)}
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-100"
              onClick={() => handleDelete(brand._id!)}
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Star className="text-brand h-8 w-8" />
        <h1 className="text-2xl font-semibold">Brands</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Input
              placeholder="Filter by title..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Link href="/vendor/brand/add">
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Add Brand
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
                      No brand found
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

export default withVendorProtection(BrandPage);
