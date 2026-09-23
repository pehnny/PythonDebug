import { useActionState } from "react";

import { createItem } from "../../../items";

export default function ItemForm({onCreated}) {

    async function createAction(prevState, formdata) {
        const item = {
            itemname: formdata.get("itemname"),
            itemdescription: formdata.get("itemdescription"),
            itemquantity: Number(formdata.get("itemstock")),
            itemprice: Number(formdata.get("itemprice"))
        };

        try {
            await createItem(item);

            onCreated();

            return {
                message: `Article "${item.itemname}" créé.`
            }
        }
        catch(error) {
            return {
                message: error.toString()
            }
        }
    }

    const [state, handleAction, isPending] = useActionState(createAction, {message: ""});

    return (
        <section>
            <h3>Nouvel article</h3>

            {
                state && state.message &&
                <p>{state.message}</p>
            }

            <form action={handleAction}>
                <div>
                    <label htmlFor="itemname">Nom : </label>
                    <input id="itemname" name="itemname" type="text"/>
                </div>
                <div>
                    <label htmlFor="itemdescription">Description : </label>
                    <input id="itemdescription" name="itemdescription" type="text"/>
                </div>
                <div>
                    <label htmlFor="itemstock">Stock : </label>
                    <input id="itemstock" name="itemstock" type="number"/>
                </div>
                <div>
                    <label htmlFor="itemprice">Prix : </label>
                    <input id="itemprice" name="itemprice" type="text"/>
                </div>
                <button type="submit" disabled={isPending}>Créer</button>
            </form>
        </section>
    );
}
