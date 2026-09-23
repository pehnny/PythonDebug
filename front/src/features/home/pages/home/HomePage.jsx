import { NavLink } from "react-router-dom";

import StatsDisplay from "../../components/StatsDisplay/StatsDisplay";

export default function HomePage() {
    return (
        <section>
            <h2>Bienvenue sur le shop</h2>

            <div className="container">
                <p>
                    Parcourez le <NavLink to="/items">catalogue</NavLink>, remplissez votre
                    panier et passez commande.
                </p>

                <StatsDisplay/>
            </div>
        </section>
    );
}
