import { NewTaskPage } from "@/views/admin/ui/NewTaskPage";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("AdminPage");
  return {
    title: `New Task - ${t("title")}`,
  };
}

export default function Page() {
  return <NewTaskPage />;
}
