import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createCommunitySchema = z.object({
  name: z.string()
    .min(1, "Community name is required")
    .max(50, "Community name too long")
    .regex(/^[a-zA-Z0-9\s]+$/, "Only letters, numbers, and spaces allowed"),
});

type CreateCommunityData = z.infer<typeof createCommunitySchema>;

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCommunityModal({ open, onOpenChange }: CreateCommunityModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCommunityData>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CreateCommunityData) => {
      return apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Community created successfully!",
      });
      form.reset();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
    },
    onError: (error: any) => {
      const message = error.message.includes("already exists") 
        ? "A community with this name already exists"
        : "Failed to create community";
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCommunityData) => {
    createCommunityMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Community</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter community name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCommunityMutation.isPending}
              >
                {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
