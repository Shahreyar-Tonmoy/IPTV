"use client";
import useSWR from "swr";
import { Channel } from "@/lib/channels";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLiveChannels() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ channels: Channel[]; updatedAt: number }>(
    "/api/channels",
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000,
    }
  );

  return {
    channels: data?.channels ?? [],
    updatedAt: data?.updatedAt,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}
