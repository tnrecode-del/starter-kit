"use client";
import { useAuth } from "../hooks/useAuth";

export function Header() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) return <div className="h-10 w-10 animate-spin" />;

  return (
    <header className="flex justify-between p-4 border-b">
      <div className="font-bold">My Starter Kit</div>

      <nav>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span>{user?.email}</span>
            <button
              onClick={() => logout()}
              className="text-red-500 hover:underline"
            >
              Выйти
            </button>
          </div>
        ) : (
          <button
            onClick={() => login({ email: "admin@starter.kit" })}
            className="text-blue-500"
          >
            Войти
          </button>
        )}
      </nav>
    </header>
  );
}
