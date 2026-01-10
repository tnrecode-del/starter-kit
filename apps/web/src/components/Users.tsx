"use client";

import { trpc } from "../utils/trpc";

export const Users = () => {
  const { data, isLoading, error } = trpc.user.getUsers.useQuery();

  if (isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error.message}</p>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>
          Name: {user.name} - Email: {user.email}
        </li>
      ))}
    </ul>
  );
};
