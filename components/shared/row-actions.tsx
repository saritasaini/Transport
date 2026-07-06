"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface RowActionsProps {
  editUrl?: string;
  editContent?: React.ReactNode;
  editModalTitle?: string;
  onDelete?: () => Promise<{ error?: string } | { success?: boolean } | void>;
  deleteTitle?: string;
  deleteDescription?: string;
  customTrigger?: React.ReactNode;
}

export function RowActions({
  editUrl,
  editContent,
  editModalTitle = "Edit Record",
  onDelete,
  deleteTitle = "Delete Record",
  deleteDescription = "Are you sure you want to delete this record? This action cannot be undone.",
  customTrigger,
}: RowActionsProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      const result = await onDelete();
      if (result && "error" in result && result.error) {
        toast.error(String(result.error));
      } else {
        toast.success("Record deleted successfully");
      }
    } catch (e) {
      toast.error("Failed to delete record");
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      {customTrigger ? (
        <div onClick={() => setShowEditModal(true)} className="inline-block cursor-pointer">
          {customTrigger}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {editUrl && !editContent && (
              <DropdownMenuItem asChild>
                <Link href={editUrl} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            )}
            {editContent && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowEditModal(true);
                }}
                className="flex items-center cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {(editUrl || editContent) && onDelete && <DropdownMenuSeparator />}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive flex items-center cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setShowDeleteAlert(true);
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {editContent && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editModalTitle}</DialogTitle>
            </DialogHeader>
            {React.isValidElement(editContent) 
              ? React.cloneElement(editContent as React.ReactElement<any>, { 
                  onSuccess: () => setShowEditModal(false),
                  onCancel: () => setShowEditModal(false)
                }) 
              : editContent}
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
