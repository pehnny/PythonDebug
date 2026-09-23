export default function OrderReport({report}) {
    return (
        <>
            <h3>Commandes ({report.length})</h3>

            <table>
                <thead>
                    <tr>
                        <th>Panier</th>
                        <th>Client</th>
                        <th>Lignes</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        report.map(line =>
                            <tr key={line.basketid}>
                                <td>{line.basketid}</td>
                                <td>{line.username}</td>
                                <td>{line.itemcount}</td>
                                <td>{line.total.toFixed(2)} €</td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
        </>
    );
}
