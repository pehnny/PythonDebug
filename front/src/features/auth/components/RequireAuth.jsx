import { useNavigate } from "react-router-dom"
import { useAtom } from "jotai"
import { useEffect } from "react"

import { tokenAtom } from "../store"

export default function RequireAuth({children}) {
    const [token] = useAtom(tokenAtom)
    const nav = useNavigate()

    useEffect(() => {
        if (!token) {
            nav('/login', {replace: true});
        }
    }, [token, nav]);

    if (!token) {
        return null;
    }

    return children;
}
