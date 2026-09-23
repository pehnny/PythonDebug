import { Route, Routes } from "react-router-dom";
import { HomePage } from "./features/home";
import { authRoutes } from "./features/auth";
import { itemRoutes } from "./features/items";
import { basketRoutes } from "./features/basket";
import { adminRoutes } from "./features/admin";
import { ResourceNotFound } from "./shared";

export default function AppRoutes() {
    return(
        <Routes>
            <Route path="" element={<HomePage/>}/>
            {authRoutes}
            {itemRoutes}
            {basketRoutes}
            {adminRoutes}
            <Route path="*" element={<ResourceNotFound sentence="Cette page n'existe pas."/>}/>
        </Routes>
    );
}
