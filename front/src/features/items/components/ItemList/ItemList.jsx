import { useState } from "react";
import { NavLink } from "react-router-dom";

import styles from "./ItemList.module.css";

export default function ItemList({items, canOrder = false, onAddToBasket}) {
    if (items.length === 0) {
        return (
            <p>Aucun article.</p>
        );
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Article</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {
                    items.map((item, index) =>
                        <ItemRow key={index}
                                 item={item}
                                 canOrder={canOrder}
                                 onAddToBasket={onAddToBasket}/>
                    )
                }
            </tbody>
        </table>
    );
}

function ItemRow({item, canOrder, onAddToBasket}) {
    const [quantity, setQuantity] = useState(1);

    return (
        <tr>
            <td>
                <NavLink to={`/items/${item.itemid}`}>{item.itemname}</NavLink>
                <p className={styles.description}>{item.itemdescription}</p>
            </td>
            <td>{item.itemprice} €</td>
            <td>{item.itemstock}</td>
            <td>
                {
                    canOrder &&
                    <>
                        <input className={styles.quantity} type="number" min="1"
                               value={quantity} onChange={(e) => setQuantity(e.target.value)}/>
                        <button onClick={() => onAddToBasket(item.itemid, quantity)}>Ajouter</button>
                    </>
                }
            </td>
        </tr>
    );
}
