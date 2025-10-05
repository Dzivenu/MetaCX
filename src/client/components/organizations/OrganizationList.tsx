"use client";

import { useState } from 'react';
import { useOrganizations } from '@/client/hooks/useOrganizations';
import { CreateOrganizationModal } from './CreateOrganizationModal';
import { EditOrganizationModal } from './EditOrganizationModal';
import { OrganizationCard } from './OrganizationCard';

export function OrganizationList() {
  const { 
    organizations, 
    activeOrganization, 
    loading, 
    error,
    setActive,
    deleteOrganization 
  } = useOrganizations();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);

  const handleSetActive = async (orgId: string) => {
    try {
      await setActive(orgId);
    } catch (err) {
      console.error('Failed to set active organization:', err);
    }
  };

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteOrganization(orgId);
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };

  if (loading && organizations.length === 0) {
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
          <p className="text-gray-600 mb-6">Create your first organization to get started</p>
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
              onSetActive={() => handleSetActive(org.id)}
              onEdit={() => setEditingOrg(org)}
              onDelete={() => handleDelete(org.id, org.name)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingOrg && (
        <EditOrganizationModal
          organization={editingOrg}
          onClose={() => setEditingOrg(null)}
        />
      )}
    </div>
  );
}