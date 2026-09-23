import { Route } from "react-router-dom";
import AdminPage from "./pages/admin/AdminPage";
import { RequireAuth } from "../auth";

export const adminRoutes = (
    <Route path="/admin" element={
        <RequireAuth>
            <AdminPage/>
        </RequireAuth>
    }/>
);
