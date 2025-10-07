"use client";

import { useState } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useActiveOrganization } from "@/client/hooks/useActiveOrganization";
import { CreateOrganizationModal } from "./CreateOrganizationModal";
import { OrganizationCard } from "./OrganizationCard";

export function OrganizationList() {
  const {
    activeOrganization,
    loading: activeOrgLoading,
    setActiveOrganization,
  } = useActiveOrganization();
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Extract organizations from Clerk membership list
  const organizations =
    userMemberships?.data?.map((membership) => ({
      id: membership.organization.id,
      slug: membership.organization.slug || "",
      name: membership.organization.name,
      logo: membership.organization.imageUrl,
      metadata: {},
    })) || [];

  const handleSetActive = async (orgId: string, orgSlug: string) => {
    try {
      await setActiveOrganization(orgId, orgSlug);
    } catch (err) {
      console.error("Failed to set active organization:", err);
    }
  };

  if ((activeOrgLoading || !isLoaded) && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Manage your organizations and teams</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Organization
        </button>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No organizations yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first organization to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              isActive={activeOrganization?.id === org.id}
              onSetActive={() => handleSetActive(org.id, org.slug)}
            />
          ))}
        </div>
      )}

      <CreateOrganizationModal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
