import { Route } from "react-router-dom";
import BasketPage from "./pages/basket/BasketPage";
import { RequireAuth } from "../auth";

export const basketRoutes = (
    <Route path="/basket" element={
        <RequireAuth>
            <BasketPage/>
        </RequireAuth>
    }/>
);
