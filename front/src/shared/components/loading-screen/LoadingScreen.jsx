import styles from "./LoadingScreen.module.css";

export default function LoadingScreen ({sentence = "Chargement en cours ..."}) {
    return (
        <div className={styles.loadingPage}>
            <h2>{sentence}</h2>

            <div className={styles.loader}>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
}
