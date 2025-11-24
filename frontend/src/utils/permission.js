export const PERMISSIONS = {
  ALL: "all",
  KASIR: "kasir",
  RIWAYAT: "riwayat",
  PRODUCTS_VIEW: "products_view",
  CATEGORIES_VIEW: "categories_view",
};

export const checkPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return (
    userPermissions.includes(PERMISSIONS.ALL) ||
    userPermissions.includes(requiredPermission)
  );
};
