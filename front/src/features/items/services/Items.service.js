import { api } from "../../../shared";

export async function getAllItems() {
    return await api.get("items");
}

export async function getItemById(id) {
    return await api.get(`items/${id}`);
}

export async function getLowStockItems(threshold) {
    return await api.get(`items/low-stock?threshold=${threshold}`);
}

export async function createItem(item) {
    return await api.post("items/add", item);
}
