export interface User {
  id: string;
  email: string;
  name: string;
  username: string | null;
  active: boolean;
  emailVerified: boolean;
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  permissions: {
    isAdmin: boolean;
    isOrgAdmin: boolean;
    isOrgOwner: boolean;
    canManageUsers: boolean;
    canManageOrganizations: boolean;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  members?: Array<{
    id: string;
    role: string;
    [key: string]: any;
  }>;
}

export interface UserOrgRole {
  userIsOrgAdmin: boolean;
  userIsOrgMember: boolean;
  userIsOrgOwner: boolean;
}

export function parseUserAndOrg(user: User, org: Organization): UserOrgRole {
  if (!user || !org || !user.activeOrganization) {
    return {
      userIsOrgAdmin: false,
      userIsOrgMember: false,
      userIsOrgOwner: false,
    };
  }

  // Check if the provided org matches the user's active organization
  if (user.activeOrganization.id !== org.id) {
    return {
      userIsOrgAdmin: false,
      userIsOrgMember: false,
      userIsOrgOwner: false,
    };
  }

  // Use the role from activeOrganization
  const role = user.activeOrganization.role.toLowerCase();

  return {
    userIsOrgAdmin: role === 'admin',
    userIsOrgMember: role === 'member',
    userIsOrgOwner: role === 'owner',
  };
}
