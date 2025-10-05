import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  typeof: 'TELLER' | 'MANAGER' | 'ADMIN';
  active: boolean;
  created_at: string;
  last_sign_in_at?: string;
  email_verified: boolean;
  auth_exists: boolean;
  authorized_repo_ids: string[];
  organizations?: Array<{
    organizationId: string;
    role: string;
    organizationName: string;
    organizationSlug?: string;
  }>;
}

export interface UserFilters {
  search?: string;
  userType?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  typeof: 'TELLER' | 'MANAGER' | 'ADMIN';
  active?: boolean;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  typeof?: 'TELLER' | 'MANAGER' | 'ADMIN';
  active?: boolean;
  authorized_repo_ids?: string[];
}

export interface Repository {
  id: string;
  name: string;
  typeOf?: string;
  currencyType?: string;
  active?: boolean;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { user: currentUser } = useAuth();

  const fetchUsers = async (filters: UserFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.userType) params.append('userType', filters.userType);
      if (filters.activeOnly !== undefined) params.append('activeOnly', filters.activeOnly.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/users?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching user:', err);
      throw err;
    }
  };

  const createUser = async (userData: CreateUserData): Promise<User> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user: userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      
      // Refresh users list
      await fetchUsers();
      
      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData): Promise<User> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user: userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      
      // Update users list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updatedUser } : user
      ));
      
      return updatedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const archiveUser = async (userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/users/archive/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive user');
      }

      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error('Error archiving user:', err);
      throw err;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove from users list
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  const addUserToRepository = async (repositoryId: string, userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/repositories/${repositoryId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user to repository');
      }
    } catch (err) {
      console.error('Error adding user to repository:', err);
      throw err;
    }
  };

  const removeUserFromRepository = async (repositoryId: string, userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/repositories/${repositoryId}/users?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user from repository');
      }
    } catch (err) {
      console.error('Error removing user from repository:', err);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    total,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    archiveUser,
    deleteUser,
    addUserToRepository,
    removeUserFromRepository,
    currentUser,
  };
}

export function useUserAuthorities() {
  const [authorities, setAuthorities] = useState<{
    repo_name_ids: Array<{ name: string; id: string; typeOf?: string; currencyType?: string; active?: boolean }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthorities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/authorities_list', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch authorities');
      }

      const data = await response.json();
      setAuthorities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching authorities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorities();
  }, []);

  return {
    authorities,
    loading,
    error,
    fetchAuthorities,
  };
}