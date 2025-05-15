import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";
import { IReferral } from "@/types";

// Schema definition
const referralFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  rewardPoints: z.number().min(1, "Reward points must be at least 1"),
  expiryDate: z.string(),
  maxUses: z.number().min(1, "Maximum uses must be at least 1"),
  isActive: z.boolean().default(true),
});

export type ReferralFormValues = z.infer<typeof referralFormSchema>;

interface ReferralFormProps {
  onSubmit: (values: ReferralFormValues) => Promise<void>;
  editingReferral: IReferral | null;
  isSubmitting: boolean;
  onCancel: () => void;
}

const ReferralForm = ({
  onSubmit,
  editingReferral,
  isSubmitting,
  onCancel,
}: ReferralFormProps) => {
  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      name: editingReferral?.name || "",
      description: editingReferral?.description || "",
      rewardPoints: editingReferral?.rewardPoints || 100,
      expiryDate: editingReferral
        ? new Date(editingReferral.expiryDate).toISOString().split("T")[0]
        : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      maxUses: editingReferral?.maxUses || 100,
      isActive: editingReferral?.isActive ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral Name</FormLabel>
              <FormControl>
                <Input placeholder="Welcome Rewards Campaign" {...field} />
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
                  placeholder="Get new users 100 reward points when they sign up with this referral link..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rewardPoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reward Points</FormLabel>
              <FormDescription>
                Points awarded to users who sign up with this referral link.
                Every 10 points equals ₹1 discount at checkout.
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                />
              </FormControl>
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
                    onChange={(e) => field.onChange(Number(e.target.value))}
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="primary-btn">
            {isSubmitting ? "Saving..." : editingReferral ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default ReferralForm;
