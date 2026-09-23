import { Suspense, use, useState } from "react";
import { useAtom } from "jotai";

import { LoadingScreen } from "../../../../shared";
import { tokenAtom } from "../../../auth";
import { addItemToBasket } from "../../../basket";
import { getAllItems } from "../../services/Items.service";
import ItemList from "../../components/ItemList/ItemList";

export default function ItemCatalog() {
    const [query, setQuery] = useState('');

    const itemListPromise = getAllItems();

    return (
        <section>
            <h2>Catalogue</h2>

            <form onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label htmlFor="search">Rechercher : </label>
                    <input id="search" name="search" type="text"
                           value={query} onChange={(e) => setQuery(e.target.value)}/>
                </div>
            </form>

            <Suspense fallback={<LoadingScreen sentence="Chargement du catalogue..."/>}>
                <InnerItemCatalog itemListPromise={itemListPromise} query={query}/>
            </Suspense>
        </section>
    );
}

function InnerItemCatalog({itemListPromise, query}) {
    const itemList = use(itemListPromise);
    const [token] = useAtom(tokenAtom);
    const [message, setMessage] = useState('');

    const filteredItems = itemList.filter(item => item.itemname.includes(query));

    const handleAddToBasket = async (itemid, itemquantity) => {
        await addItemToBasket(itemid, itemquantity);

        setMessage("Article ajouté au panier.");
    }

    return (
        <>
            {message && <p>{message}</p>}
            <ItemList items={filteredItems}
                      canOrder={token !== ''}
                      onAddToBasket={handleAddToBasket}/>
        </>
    );
}
