import { useNavigate } from "react-router-dom";
import { useActionState } from "react";
import { useAtom } from "jotai";

import { tokenAtom, userAtom } from "../../store";
import { login } from "../../services/Auth.service";
import { storeToken, readUserFromToken } from "../../../../shared";

export default function LoginPage() {
    const [_token, setToken] = useAtom(tokenAtom);
    const [_userConnected, setUserConnected] = useAtom(userAtom);

    const nav = useNavigate();

    async function loginAction(prevState, formdata) {
        const username = formdata.get("username");
        const userpassword = formdata.get("userpassword");

        try {
            await login(username, userpassword).then(
                data => {
                    if (data) {
                        storeToken(data.token);

                        setToken(data.token);
                        setUserConnected(readUserFromToken(data.token));

                        nav('/');
                    }
                }
            )
        }
        catch(error) {
            return {
                message: error.toString()
            }
        }
    }

    const [state, handleAction, isPending] = useActionState(loginAction, {message : ""});

    return (
        <section>
            <h2>Connexion</h2>
            {
                state && state.message &&
                <p className="error">{state.message}</p>
            }
            <form action={handleAction}>
                <div>
                    <label htmlFor="username">Utilisateur : </label>
                    <input id="username" name="username" type="text" />
                </div>
                <div>
                    <label htmlFor="userpassword">Mot de passe : </label>
                    <input id="userpassword" name="userpassword" type="password" />
                </div>
                <button type="submit" disabled={isPending}>Connexion</button>
            </form>
        </section>
    )
}
