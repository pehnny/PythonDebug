import { Route } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";

export const authRoutes = (
    <>
        <Route path="/login" element={<LoginPage/>}/>
    </>
);
