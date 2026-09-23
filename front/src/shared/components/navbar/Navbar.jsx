import { NavLink, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";

import styles from "./Navbar.module.css";

import { tokenAtom, userAtom } from "../../../features/auth/store";
import { basketCountAtom } from "../../../features/basket/store";
import { clearStoredToken } from "../../utils/token";

export default function Navbar() {
    const [token, setToken] = useAtom(tokenAtom);
    const [userConnected, setUserConnected] = useAtom(userAtom);
    const [basketCount] = useAtom(basketCountAtom);

    const nav = useNavigate();

    const handleClick = () => {
        if (token) {
            clearStoredToken();

            setToken('');
            setUserConnected(null);

            nav('/');
        } else {
            nav("/login");
        }
    }

    return (
        <nav className={styles.Navbar}>
            <ul className={styles.NavbarContent}>
                <li>
                    <NavLink to="/" className={styles.NavbarBrand}>Shop</NavLink>
                </li>
                <li>
                    <NavLink to="/items">Catalogue</NavLink>
                </li>
                {
                    token &&
                    <li>
                        <NavLink to="/basket">
                            Panier
                            {basketCount && <span className={styles.badge}>{basketCount}</span>}
                        </NavLink>
                    </li>
                }
                {
                    userConnected && userConnected.isAdmin &&
                    <li>
                        <NavLink to="/admin">Administration</NavLink>
                    </li>
                }
            </ul>
            <div className={styles.NavbarContent}>
                {
                    token ?
                    <a onClick={handleClick}>Se déconnecter ({userConnected && userConnected.username})</a>:
                    <a onClick={handleClick}>Se connecter</a>
                }
            </div>
        </nav>
    );
}
