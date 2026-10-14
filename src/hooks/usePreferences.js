import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPreferences,
  runAiPick,
  runLunchMatch,
  savePreference,
} from '../api/preferences'

export const usePreferences = () => {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => fetchPreferences(),
  })
}

export const useSavePreference = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: savePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })
}

export const useAiPick = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: runAiPick,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })
}

export const useLunchMatch = () => {
  return useMutation({
    mutationFn: runLunchMatch,
  })
}
