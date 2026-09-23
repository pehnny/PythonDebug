import { api } from "../../../shared";

export async function getBasket() {
    return await api.get("basket");
}

export async function addItemToBasket(itemid, itemquantity) {
    return await api.put("basket/", { itemid, itemquantity });
}

export async function removeItemFromBasket(itemid) {
    return await api.delete(`basket/${itemid}`);
}

export async function checkout() {
    return await api.post("basket/checkout");
}
