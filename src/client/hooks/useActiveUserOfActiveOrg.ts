import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface ActiveUserOrgRole {
  activeUser: any;
  activeUserIsActiveOrgAdmin: boolean;
  activeUserIsActiveOrgMember: boolean;
  activeUserIsActiveOrgOwner: boolean;
  activeUserIsActiveOrgAdminOrOwner: boolean;
}

export function useActiveUserOfActiveOrg(): ActiveUserOrgRole {
  const { user: currentUser } = useAuth();

  const result = useMemo((): ActiveUserOrgRole => {
    if (!currentUser || !currentUser.activeOrganization) {
      return {
        activeUser: currentUser || null,
        activeUserIsActiveOrgAdmin: false,
        activeUserIsActiveOrgMember: false,
        activeUserIsActiveOrgOwner: false,
        activeUserIsActiveOrgAdminOrOwner: false,
      };
    }

    // Get role directly from activeOrganization
    const role = currentUser.activeOrganization.role.toLowerCase();
    
    // Handle both Clerk role formats: "admin" and "org:admin"
    const isAdmin = role === 'admin' || role === 'org:admin';
    const isMember = role === 'member' || role === 'org:member';
    const isOwner = role === 'owner' || role === 'org:owner';

    return {
      activeUser: currentUser,
      activeUserIsActiveOrgAdmin: isAdmin,
      activeUserIsActiveOrgMember: isMember,
      activeUserIsActiveOrgOwner: isOwner,
      activeUserIsActiveOrgAdminOrOwner: isAdmin || isOwner,
    };
  }, [currentUser]);

  return result;
}