import styles from "./ResourceNotFound.module.css";

export default function ResourceNotFound({sentence="La ressource recherchée n'a pas été trouvée..."}) {
    return (
        <article className={styles.container}>
            <h1>{sentence}</h1>
        </article>
    )
}
