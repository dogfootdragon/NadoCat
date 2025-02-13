import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMissingPost, deleteMissingPost, getMissingDetail, IMissingDetailParam, updateFound, updateMissingPost } from "../api/missing.api";
import { create } from "zustand";


const useMissing = (postId: number) => {
  const queryClient = useQueryClient();


  const { data, isLoading, error } = useQuery({
    queryKey: ["missingDetail", postId],
    queryFn: () => getMissingDetail({ postId }),
  });

  const { mutateAsync: removeMissingPost } = useMutation({
    mutationFn: ({ postId }: IMissingDetailParam) => deleteMissingPost({ postId }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["missingDetail", postId] });
    },
    onError: (error) => {
      console.error("Error deleting Missing post:", error);
    },
  });

  const { mutateAsync: editMissingPost } = useMutation({
    mutationFn: ({ formData, postId }: { formData: FormData; postId: number }) =>
      updateMissingPost({ formData, postId }),
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ["MissingDetail", postId] });
    // },
    onError: (error) => {
      console.error("Error updating Missing post:", error);
    },
  });

  return {
    data,
    isLoading,
    error,
    removeMissingPost,
    editMissingPost,
  };
};

export const addMissingPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createMissingPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error("Error creating street cat post:", error);
    },
  });
};

export const useUpdateFound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, found }: { postId: number, found: boolean }) => updateFound(postId, found),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error("Error updating missing report post:", error);
    },
  });
};
export default useMissing;

interface FoundState {
  found: boolean;
  setFound: (value: boolean) => void;
}

export const useFoundStateStore = create<FoundState>((set) => ({
  found: false,
  setFound: (value: boolean) => set({ found: value }),
}));