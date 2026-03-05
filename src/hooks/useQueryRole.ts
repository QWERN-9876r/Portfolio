import { useState, useEffect, useCallback } from "react";

export type Role = "frontend" | "fullstack" | "backend";

const ROLES: Role[] = ["frontend", "fullstack", "backend"];

const ROLE_LABELS: Record<Role, string> = {
  frontend: "Frontend",
  fullstack: "Fullstack",
  backend: "Backend",
};

const DEFAULT_ROLE: Role = "frontend";

const isValidRole = (value: string | null): value is Role =>
  ROLES.includes(value as Role);

const getRoleFromQuery = (): Role => {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("role");
  return isValidRole(value) ? value : DEFAULT_ROLE;
};

const setRoleToQuery = (role: Role): void => {
  const params = new URLSearchParams(window.location.search);
  params.set("role", role);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
};

export const useQueryRole = () => {
  const [role, setRoleState] = useState<Role>(getRoleFromQuery);

  // При первом рендере синхронизируем query если его нет
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("role")) {
      setRoleToQuery(DEFAULT_ROLE);
    }
  }, []);

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
    setRoleToQuery(newRole);
  }, []);

  return { role, setRole, roles: ROLES, roleLabels: ROLE_LABELS };
};
