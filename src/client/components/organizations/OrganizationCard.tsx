"use client";

interface Organization {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  description?: string;
  metadata?: {
    description?: string;
  };
  members?: any[];
  invitations?: any[];
}

interface OrganizationCardProps {
  organization: Organization;
  isActive: boolean;
  onSetActive: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function OrganizationCard({
  organization,
  isActive,
  onSetActive,
  onEdit,
  onDelete,
}: OrganizationCardProps) {
  const memberCount = organization.members?.length || 0;
  const invitationCount =
    organization.invitations?.filter((inv) => inv.status === "pending")
      .length || 0;

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 transition-all hover:shadow-lg ${
        isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {organization.logo ? (
            <img
              src={organization.logo}
              alt={organization.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-lg">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{organization.name}</h3>
            <p className="text-sm text-gray-500">@{organization.slug}</p>
          </div>
        </div>

        {isActive && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </div>

      {organization.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {organization.metadata?.description || organization.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
        {invitationCount > 0 && (
          <span>
            {invitationCount} pending invitation
            {invitationCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {!isActive && (
          <button
            onClick={onSetActive}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Set Active
          </button>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Edit organization"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-2 text-red-600 hover:text-red-900 transition-colors"
            title="Delete organization"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
