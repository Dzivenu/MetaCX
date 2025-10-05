"use client";

import { useState } from 'react';
import { useOrganizations, Member, Invitation } from '@/client/hooks/useOrganizations';
import { InviteMemberModal } from './InviteMemberModal';

interface MemberManagementProps {
  organizationId: string;
}

export function MemberManagement({ organizationId }: MemberManagementProps) {
  const { 
    activeOrganization, 
    loading, 
    removeMember, 
    updateMemberRole, 
    cancelInvitation 
  } = useOrganizations();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  if (!activeOrganization || activeOrganization.id !== organizationId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Organization not found or not active</p>
      </div>
    );
  }

  const members = activeOrganization.members || [];
  const invitations = activeOrganization.invitations || [];
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const handleRemoveMember = async (member: Member) => {
    if (!confirm(`Are you sure you want to remove ${member.user.name} from this organization?`)) {
      return;
    }

    try {
      await removeMember(organizationId, member.userId);
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole(organizationId, memberId, newRole);
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update member role:', err);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId);
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Members & Invitations</h2>
          <p className="text-gray-600">Manage organization members and their roles</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Invite Member
        </button>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Members ({members.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {members.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No members found
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {editingMember?.id === member.id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button
                        onClick={() => setEditingMember(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      
                      <button
                        onClick={() => setEditingMember(member)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="text-red-400 hover:text-red-600"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Invitations ({pendingInvitations.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited by {invitation.inviter.user.name} • 
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                    {invitation.role}
                  </span>
                  
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="text-red-400 hover:text-red-600"
                    title="Cancel invitation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          organizationId={organizationId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}