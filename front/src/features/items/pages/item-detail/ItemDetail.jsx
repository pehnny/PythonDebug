import { Suspense, use } from "react";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

import { LoadingScreen, ResourceNotFound } from "../../../../shared";
import { getItemById } from "../../services/Items.service";

export default function ItemDetail() {
    const { id } = useParams();

    const itemPromise = getItemById(id);

    return (
        <Suspense fallback={<LoadingScreen sentence="Chargement de l'article..."/>}>
            <ErrorBoundary fallback={<ResourceNotFound sentence="Nous n'avons pas trouvé cet article."/>}>
                <InnerItemDetail itemPromise={itemPromise}/>
            </ErrorBoundary>
        </Suspense>
    );
}

function InnerItemDetail({itemPromise}) {
    const item = use(itemPromise);

    return (
        <section>
            <h2>{item.itemname}</h2>

            <div className="container">
                <p>{item.itemdescription}</p>
                <p>Prix : {item.itemprice} €</p>
                <p>Stock : {item.itemstock}</p>
            </div>
        </section>
    );
}
