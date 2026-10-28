// Permission keys are issued by the API from its single role-policy map.
// Client code checks these capabilities, never a role name.
export const PERMISSIONS = Object.freeze({
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
  USE_AI: "use:ai",
});
