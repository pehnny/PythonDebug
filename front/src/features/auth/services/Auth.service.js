import { api } from "../../../shared";

export async function login(username, userpassword) {
    return await api.post("login", { username, userpassword });
}
