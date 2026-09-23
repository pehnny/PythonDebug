import { Suspense, use, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { LoadingScreen, ResourceNotFound } from "../../../../shared";
import { getLowStockItems, ItemList } from "../../../items";
import { getOrderReport, getUsers } from "../../services/Admin.service";
import ItemForm from "../../components/ItemForm/ItemForm";
import UserList from "../../components/UserList/UserList";
import OrderReport from "../../components/OrderReport/OrderReport";

export default function AdminPage() {
    const [threshold, setThreshold] = useState(5);

    const lowStockPromise = useMemo(() => getLowStockItems(threshold), []);
    const usersPromise = useMemo(() => getUsers(), []);
    const reportPromise = useMemo(() => getOrderReport(), []);

    return (
        <>
            <h2>Administration</h2>

            <ItemForm onCreated={() => console.log("article créé")}/>

            <section>
                <h3>Stock faible</h3>

                <form onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label htmlFor="threshold">Seuil : </label>
                        <input id="threshold" name="threshold" type="number" min="0"
                               value={threshold} onChange={(e) => setThreshold(e.target.value)}/>
                    </div>
                </form>

                <Suspense fallback={<LoadingScreen sentence="Chargement du stock..."/>}>
                    <ErrorBoundary fallback={<ResourceNotFound sentence="Stock indisponible."/>}>
                        <InnerLowStock lowStockPromise={lowStockPromise}/>
                    </ErrorBoundary>
                </Suspense>
            </section>

            <section>
                <h3>Utilisateurs</h3>

                <Suspense fallback={<LoadingScreen sentence="Chargement des utilisateurs..."/>}>
                    <ErrorBoundary fallback={<ResourceNotFound sentence="Utilisateurs indisponibles."/>}>
                        <InnerUserList usersPromise={usersPromise}/>
                    </ErrorBoundary>
                </Suspense>
            </section>

            <section>
                <Suspense fallback={<LoadingScreen sentence="Chargement des commandes..."/>}>
                    <ErrorBoundary fallback={<ResourceNotFound sentence="Commandes indisponibles."/>}>
                        <InnerOrderReport reportPromise={reportPromise}/>
                    </ErrorBoundary>
                </Suspense>
            </section>
        </>
    );
}

function InnerLowStock({lowStockPromise}) {
    const lowStock = use(lowStockPromise);

    return (
        <ItemList items={lowStock}/>
    );
}

function InnerUserList({usersPromise}) {
    const users = use(usersPromise);

    return (
        <UserList users={users}/>
    );
}

function InnerOrderReport({reportPromise}) {
    const report = use(reportPromise);

    return (
        <OrderReport report={report}/>
    );
}
