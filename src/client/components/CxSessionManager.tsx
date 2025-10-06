"use client";

import React, { useState } from "react";
import {
  useCxSessions,
  useCxSession,
  useCreateCxSession,
  useCxSessionMutations,
} from "@/client/hooks/useCxSessions";
import {
  CreateCxSessionData,
  UpdateCxSessionData,
} from "@/client/api/cx-sessions";

// Example component showing how to use the hooks
export function CxSessionManager() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  // List sessions with pagination and filtering
  const {
    sessions,
    pagination,
    filters,
    isLoading: isLoadingSessions,
    error: sessionsError,
    updateFilters,
    nextPage,
    prevPage,
    refresh,
  } = useCxSessions({
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Single session management
  const {
    session: selectedSession,
    isLoading: isLoadingSession,
    error: sessionError,
    updateSession,
    deleteSession,
  } = useCxSession(selectedSessionId || undefined);

  // Create session
  const {
    createSession,
    isLoading: isCreating,
    error: createError,
  } = useCreateCxSession();

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    updateFilters({ ...newFilters, page: 1 }); // Reset to first page when filtering
  };

  // Handle session creation
  const handleCreateSession = async (data: CreateCxSessionData) => {
    try {
      await createSession(data);
      setShowCreateForm(false);
      refresh(); // Refresh the list
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // Handle session update
  const handleUpdateSession = async (id: string, data: UpdateCxSessionData) => {
    try {
      await updateSession(id, data);
      refresh(); // Refresh the list
    } catch (error) {
      console.error("Failed to update session:", error);
    }
  };

  // Handle session deletion
  const handleDeleteSession = async (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSession(id);
        setSelectedSessionId(null);
        refresh(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CX Sessions</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="number"
            placeholder="Organization ID"
            value={filters.organizationId || ""}
            onChange={(e) =>
              handleFilterChange({
                organizationId: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="User ID"
            value={filters.userId || ""}
            onChange={(e) =>
              handleFilterChange({
                userId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Status"
            value={filters.status || ""}
            onChange={(e) =>
              handleFilterChange({
                status: e.target.value || undefined,
              })
            }
            className="border rounded px-3 py-2"
          />
          <select
            value={filters.sortBy || "createdAt"}
            onChange={(e) =>
              handleFilterChange({
                sortBy: e.target.value as any,
              })
            }
            className="border rounded px-3 py-2"
          >
            <option value="createdAt">Created At</option>
            <option value="updatedAt">Updated At</option>
            <option value="openStartDt">Open Start</option>
            <option value="closeStartDt">Close Start</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {(sessionsError || sessionError || createError) && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {sessionsError || sessionError || createError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Sessions List</h2>

          {isLoadingSessions ? (
            <div className="text-center py-4">Loading sessions...</div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedSessionId === session.id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          ID: {session.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {session.status || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Created:{" "}
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {sessions.length} of {pagination.total} sessions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={prevPage}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Session Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Session Details</h2>

          {selectedSessionId ? (
            isLoadingSession ? (
              <div className="text-center py-4">Loading session...</div>
            ) : selectedSession ? (
              <SessionDetailsForm
                session={selectedSession}
                onUpdate={(data) =>
                  handleUpdateSession(selectedSession.id, data)
                }
                isLoading={false}
              />
            ) : (
              <div className="text-center py-4 text-gray-500">
                Session not found
              </div>
            )
          ) : (
            <div className="text-center py-4 text-gray-500">
              Select a session to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateForm && (
        <CreateSessionModal
          onSubmit={handleCreateSession}
          onClose={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}

// Session Details Form Component
function SessionDetailsForm({
  session,
  onUpdate,
  isLoading,
}: {
  session: any;
  onUpdate: (data: UpdateCxSessionData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    status: session.status || "",
    userId: session.userId || "",
    organizationId: session.organizationId || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      status: formData.status || undefined,
      userId: formData.userId || undefined,
      organizationId: formData.organizationId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <input
          type="text"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">User ID</label>
        <input
          type="number"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Organization ID
        </label>
        <input
          type="number"
          value={formData.organizationId}
          onChange={(e) =>
            setFormData({ ...formData, organizationId: e.target.value })
          }
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? "Updating..." : "Update Session"}
      </button>
    </form>
  );
}

// Create Session Modal Component
function CreateSessionModal({
  onSubmit,
  onClose,
  isLoading,
}: {
  onSubmit: (data: CreateCxSessionData) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    status: "",
    userId: "",
    organizationId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      status: formData.status || undefined,
      userId: formData.userId || undefined,
      organizationId: formData.organizationId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Session</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input
              type="text"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="number"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Organization ID
            </label>
            <input
              type="number"
              value={formData.organizationId}
              onChange={(e) =>
                setFormData({ ...formData, organizationId: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
