import { api } from "../../../shared";

export async function getUsers() {
    return await api.get("users");
}

export async function getOrderReport() {
    return await api.get("basket/report");
}
