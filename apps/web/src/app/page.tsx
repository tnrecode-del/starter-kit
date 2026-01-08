import type { Metadata } from "next";
import { PROJECT_NAME, PROJECT_DESCRIPTION } from "@core/shared/constants";

export const metadata: Metadata = {
  title: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
};

export default function Home() {
  return (
    <main>
      <h1 className="pb-40 text-center">Web Application</h1>
      <p>Welcome to our {PROJECT_NAME}</p>
    </main>
  );
}
