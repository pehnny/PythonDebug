import { Suspense, use, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useAtom } from "jotai";

import { LoadingScreen, ResourceNotFound } from "../../../../shared";
import { basketCountAtom } from "../../store";
import { getBasket, removeItemFromBasket, checkout } from "../../services/Basket.service";
import BasketTable from "../../components/BasketTable/BasketTable";

export default function BasketPage() {
    const [basketPromise, setBasketPromise] = useState(() => getBasket());

    const reload = () => setBasketPromise(getBasket());

    return (
        <section>
            <h2>Mon panier</h2>

            <Suspense fallback={<LoadingScreen sentence="Chargement du panier..."/>}>
                <ErrorBoundary fallback={<ResourceNotFound sentence="Votre panier n'a pas pu être chargé."/>}>
                    <InnerBasketPage basketPromise={basketPromise} onReload={reload}/>
                </ErrorBoundary>
            </Suspense>
        </section>
    );
}

function InnerBasketPage({basketPromise, onReload}) {
    const basket = use(basketPromise);
    const [_basketCount, setBasketCount] = useAtom(basketCountAtom);

    useEffect(() => {
        setBasketCount(basket.items.length);
    }, [basket, setBasketCount]);

    const handleRemove = async (itemid) => {
        await removeItemFromBasket(itemid);

        onReload();
    }

    const handleCheckout = async () => {
        await checkout();

        onReload();
    }

    return (
        <BasketTable basket={basket} onRemove={handleRemove} onCheckout={handleCheckout}/>
    );
}
