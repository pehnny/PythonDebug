import styles from "./BasketTable.module.css";

export default function BasketTable({basket, onRemove, onCheckout}) {
    if (basket.items.length === 0) {
        return (
            <p>Votre panier est vide.</p>
        );
    }

    const total = basket.items.reduce(
        (sum, item) => sum + item.itemprice * item.itemquantity, 0);

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Article</th>
                        <th>Quantité</th>
                        <th>Prix unitaire</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        basket.items.map((item, index) =>
                            <tr key={item.itemid}>
                                <td>{item.itemname}</td>
                                <td>{item.itemquantity}</td>
                                <td>{item.itemprice} €</td>
                                <td><button onClick={() => onRemove(index)}>Retirer</button></td>
                            </tr>
                        )
                    }
                </tbody>
            </table>

            <p className={styles.total}>Total : {total} €</p>

            <button onClick={onCheckout}>Commander</button>
        </>
    );
}
