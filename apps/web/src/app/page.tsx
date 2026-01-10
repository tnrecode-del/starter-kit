import { Users } from "../components/Users";

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Список клиентов:</h1>
      <Users />
    </main>
  );
}
