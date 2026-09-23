import { api } from "../../../shared";

export async function getStats() {
    return await api.get("stats");
}
