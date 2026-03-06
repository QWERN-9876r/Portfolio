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

// Новый хук для подписки на изменения
export const useQueryRole = () => {
  const [role, setRoleState] = useState<Role>(getRoleFromQuery);

  useEffect(() => {
    // Функция для обработки изменений URL
    const handlePopState = () => {
      setRoleState(getRoleFromQuery());
    };

    // Подписываемся на события изменения истории
    window.addEventListener("popstate", handlePopState);

    // Подписываемся на изменения через push/replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handlePopState();
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handlePopState();
      return result;
    };

    // Наблюдатель за изменением URL (для случаев, когда кто-то меняет location напрямую)
    let lastUrl = window.location.href;
    const urlObserver = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setRoleState(getRoleFromQuery());
      }
    }, 100);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearInterval(urlObserver);
    };
  }, []);

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
    setRoleToQuery(newRole);
  }, []);

  return { role, setRole, roles: ROLES, roleLabels: ROLE_LABELS };
};
