import { atom } from "jotai";

import { getStoredToken, readUserFromToken } from "../../../shared/utils/token";

export const tokenAtom = atom('');
export const userAtom = atom(readUserFromToken(getStoredToken()));
