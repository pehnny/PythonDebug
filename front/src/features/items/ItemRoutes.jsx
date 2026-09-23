import { Route } from "react-router-dom";
import ItemCatalog from "./pages/item-catalog/ItemCatalog";
import ItemDetail from "./pages/item-detail/ItemDetail";

export const itemRoutes = (
    <Route path="/items">
        <Route path="" index element={<ItemCatalog/>}/>
        <Route path=":id" element={<ItemDetail/>}/>
    </Route>
);
