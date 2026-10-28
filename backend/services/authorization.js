export const ADMIN_ROLES = Object.freeze({
  SUPER: "SUPER",
  MAJOR: "MAJOR",
  MINOR: "MINOR",
});

export const PERMISSIONS = Object.freeze({
  READ_REPOSITORY: "read:repository",
  USE_AI: "use:ai",
  MANAGE_ADMINS: "manage:admins",
  CREATE_COMPANY: "create:company",
  UPDATE_COMPANY: "update:company",
  RENAME_COMPANY: "rename:company",
  DELETE_COMPANY: "delete:company",
  UPLOAD_FILE: "upload:file",
  DELETE_FILE: "delete:file",
  CREATE_MEETING: "create:meeting",
  UPDATE_MEETING: "update:meeting",
  DELETE_MEETING: "delete:meeting",
});

// This is the single source of truth for role capabilities. Update this map
// when a role's permissions change; API middleware and the frontend consume it.
export const ROLE_PERMISSIONS = Object.freeze({
  [ADMIN_ROLES.SUPER]: Object.values(PERMISSIONS),
  [ADMIN_ROLES.MAJOR]: [
    PERMISSIONS.READ_REPOSITORY,
    PERMISSIONS.USE_AI,
    PERMISSIONS.CREATE_COMPANY,
    PERMISSIONS.UPDATE_COMPANY,
    PERMISSIONS.UPLOAD_FILE,
    PERMISSIONS.DELETE_FILE,
    PERMISSIONS.CREATE_MEETING,
    PERMISSIONS.UPDATE_MEETING,
    PERMISSIONS.DELETE_MEETING,
  ],
  [ADMIN_ROLES.MINOR]: [
    PERMISSIONS.READ_REPOSITORY,
    PERMISSIONS.USE_AI,
    PERMISSIONS.UPLOAD_FILE,
    PERMISSIONS.CREATE_MEETING,
  ],
});

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}
