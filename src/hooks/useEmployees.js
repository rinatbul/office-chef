import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEmployee, fetchEmployees, updateEmployee } from '../api/employees'
import { useAuth } from '../context/AuthContext'

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  })
}

export const useEmployee = (id) => {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => fetchEmployee(id),
    enabled: Boolean(id),
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { updateSession } = useAuth()

  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: (employee) => {
      updateSession(employee)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.setQueryData(['employees', employee.id], employee)
    },
  })
}
