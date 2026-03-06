import { useState, useEffect, useCallback } from "react";

export type Role = "frontend" | "fullstack" | "backend";

interface CustomMessageEvent extends CustomEvent {
  detail: {
    data: {
      event: string;
      newRole: Role;
    };
  };
}

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("role")) {
      setRoleToQuery(DEFAULT_ROLE);
    }

    const listener = (event: Event) => {
      const customEvent = event as CustomMessageEvent;
      const { data } = customEvent.detail;

      if (data.event !== "changeRole") return;

      setRoleState(data.newRole);
    };

    window.addEventListener("message_v2", listener as EventListener);

    return () =>
      window.removeEventListener("message_v2", listener as EventListener);
  }, []);

  const setRole = useCallback((newRole: Role) => {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("message_v2", {
          detail: {
            data: {
              event: "changeRole",
              newRole,
            },
          },
        }),
      );
    }, 500);

    setRoleState(newRole);
    setRoleToQuery(newRole);
  }, []);

  return { role, setRole, roles: ROLES, roleLabels: ROLE_LABELS };
};
