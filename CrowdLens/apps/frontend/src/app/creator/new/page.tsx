import { Upload } from "../components/Upload";
import { fetchEconomics } from "@/lib/server-data";

export default async function NewTaskPage() {
  const economics = await fetchEconomics();
  return <Upload initialEconomics={economics} />;
}
