"use client";

import { useState } from 'react';
import { useOrganizations } from '@/client/hooks/useOrganizations';
import { MemberManagement } from './MemberManagement';
import { EditOrganizationModal } from './EditOrganizationModal';

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const { 
    activeOrganization, 
    loading, 
    error, 
    setActive, 
    deleteOrganization,
    leaveOrganization 
  } = useOrganizations();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!activeOrganization || activeOrganization.id !== organizationId) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏢</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Organization not found</h3>
        <p className="text-gray-600">The organization you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const organization = activeOrganization;
  const memberCount = organization.members?.length || 0;
  const invitationCount = organization.invitations?.filter(inv => inv.status === 'pending').length || 0;
  const userMember = organization.members?.find(m => m.userId === organization.id); // This would need actual user ID
  const userRole = userMember?.role || 'member';

  const handleSetActive = async () => {
    try {
      await setActive(organizationId);
    } catch (err) {
      console.error('Failed to set active organization:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteOrganization(organizationId);
      // Redirect would happen here
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };

  const handleLeave = async () => {
    if (!confirm(`Are you sure you want to leave "${organization.name}"?`)) {
      return;
    }
    
    try {
      await leaveOrganization(organizationId);
      // Redirect would happen here
    } catch (err) {
      console.error('Failed to leave organization:', err);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Organization Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {organization.logo ? (
              <img 
                src={organization.logo} 
                alt={organization.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-semibold text-2xl">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-500">@{organization.slug}</p>
              {organization.metadata?.description && (
                <p className="text-gray-600 mt-2">{organization.metadata.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSetActive}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set as Active
            </button>
            
            {(userRole === 'owner' || userRole === 'admin') && (
              <button
                onClick={() => setShowEditModal(true)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Edit organization"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          {invitationCount > 0 && (
            <span>{invitationCount} pending invitation{invitationCount !== 1 ? 's' : ''}</span>
          )}
          <span>Created {new Date(organization.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{memberCount}</div>
                  <div className="text-sm text-blue-800">Total Members</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{invitationCount}</div>
                  <div className="text-sm text-yellow-800">Pending Invitations</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userRole}</div>
                  <div className="text-sm text-green-800">Your Role</div>
                </div>
              </div>
            </div>
            
            {organization.metadata?.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{organization.metadata.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <MemberManagement organizationId={organizationId} />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Edit Organization</h4>
                    <p className="text-sm text-gray-500">Update organization name, slug, and description</p>
                  </div>
                  {(userRole === 'owner' || userRole === 'admin') && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Leave Organization</h4>
                    <p className="text-sm text-gray-500">Remove yourself from this organization</p>
                  </div>
                  {userRole !== 'owner' && (
                    <button
                      onClick={handleLeave}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Leave
                    </button>
                  )}
                </div>
                
                {userRole === 'owner' && (
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h4 className="font-medium text-red-900">Delete Organization</h4>
                      <p className="text-sm text-red-700">Permanently delete this organization and all its data</p>
                    </div>
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditOrganizationModal
          organization={organization}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}