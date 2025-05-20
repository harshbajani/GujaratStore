"use client";
import { LayoutPanelLeft } from "lucide-react";
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
import {
  deleteSecondaryCategoryById,
  getAllSecondaryCategories,
} from "@/lib/actions/secondaryCategory.actions";

const SecondaryCategoryPage = () => {
  // * useStates and hooks
  const [data, setData] = useState<SecondaryCategoryWithPopulatedFields[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const router = useRouter();
  const { toast } = useToast();
  // * fetch data of secondary categories
  const fetchAllSecondaryCategories = async () => {
    try {
      setLoading(true);
      const response = await getAllSecondaryCategories(); // Use await here
      setData(response); // Directly set the data from the resolved promise
    } catch (error) {
      console.error("Failed to fetch secondary categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch secondary categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // * delete secondary category
  const handleDelete = async (id: string) => {
    try {
      await deleteSecondaryCategoryById(id);
      await fetchAllSecondaryCategories();
      toast({
        title: "Success",
        description: "Secondary Category deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete secondary category:", error);
      toast({
        title: "Error",
        description: "Failed to delete secondary category",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllSecondaryCategories();
  }, []);

  const columns: ColumnDef<SecondaryCategoryWithPopulatedFields>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
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
      accessorKey: "attributes",
      header: "Attributes",
      cell: ({ row }) => (
        <div>
          {row.original.attributes
            ?.map((attr: { name: string }) => attr.name)
            .join(", ") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="truncate max-w-[200px]">
          {row.getValue("description") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isActive") ? "default" : "secondary"}
          className={
            row.getValue("isActive")
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {row.getValue("isActive") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const secondaryCategory = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() =>
                router.push(
                  `/admin/category/secondaryCategory/edit/${secondaryCategory.id}`
                )
              }
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-100"
              onClick={() => handleDelete(secondaryCategory.id!)}
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
      <div className="flex items-center gap-3">
        <LayoutPanelLeft className="text-brand " size={30} />
        <h1 className="h1">Secondary Categories</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Input
              placeholder="Filter by name..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Link href="/admin/category/secondaryCategory/add">
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Add Secondary Category
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
                      No secondary categories found
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

export default SecondaryCategoryPage;
