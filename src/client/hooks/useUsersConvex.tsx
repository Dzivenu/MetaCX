"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export interface ConvexUser {
  id: Id<"users">;
  clerkId: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  emailVerified?: boolean;
  active?: boolean;
  createdAt: number;
  updatedAt: number;
  lastSeenAt?: number;
}

export interface CreateUserData {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  active?: boolean;
}

export function useUsersConvex() {
  // Query for all users (admin function)
  const allUsers = useQuery(api.functions.users.getAllUsers);

  // Mutations
  const adminUpdateUserMutation = useMutation(
    api.functions.users.adminUpdateUser
  );
  const adminCreateUserMutation = useMutation(
    api.functions.users.adminCreateUser
  );
  const adminArchiveUserMutation = useMutation(
    api.functions.users.adminArchiveUser
  );

  const fetchUser = async (userId: string): Promise<ConvexUser> => {
    // For now, we'll find the user from the all users list
    // In a production app, you'd want a separate getUserById query
    const users = allUsers;
    if (!users) {
      throw new Error("Users not loaded");
    }

    const user = users.find((u) => u.id === userId || u.clerkId === userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };

  const updateUser = async (
    userId: string,
    updates: UpdateUserData
  ): Promise<void> => {
    try {
      await adminUpdateUserMutation({
        userId: userId as Id<"users">,
        updates,
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const createUser = async (userData: CreateUserData): Promise<ConvexUser> => {
    try {
      const userId = await adminCreateUserMutation(userData);

      // Return the created user data
      return {
        id: userId,
        clerkId: `admin_created_${Date.now()}`,
        email: userData.email,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        active: userData.active !== undefined ? userData.active : true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as ConvexUser;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  };

  const archiveUser = async (userId: string): Promise<void> => {
    try {
      await adminArchiveUserMutation({
        userId: userId as Id<"users">,
      });
    } catch (error) {
      console.error("Failed to archive user:", error);
      throw error;
    }
  };

  return {
    // Data
    users: allUsers || [],

    // Loading states
    loading: allUsers === undefined,

    // Actions
    fetchUser,
    updateUser,
    createUser,
    archiveUser,
  };
}
