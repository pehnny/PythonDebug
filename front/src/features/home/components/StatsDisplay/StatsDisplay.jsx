import { useEffect, useState } from "react";

import styles from "./StatsDisplay.module.css";
import { getStats } from "../../services/Home.service";

const REFRESH_DELAY = 5000;

export default function StatsDisplay() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const refresh = () => getStats().then(setStats).catch(() => setStats(null));

        refresh();

        setInterval(refresh, REFRESH_DELAY);
    }, []);

    if (!stats) {
        return null;
    }

    return (
        <p className={styles.stats}>
            {stats.users} utilisateurs · {stats.items} articles en catalogue
        </p>
    );
}
