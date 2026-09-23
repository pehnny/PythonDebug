export default function UserList({users}) {
    return (
        <table>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôles</th>
                </tr>
            </thead>
            <tbody>
                {
                    users.map(user =>
                        <tr>
                            <td>{user.userid}</td>
                            <td>{user.username}</td>
                            <td>{user.useremail}</td>
                            <td>{user.userroles.map(role => role.rolename).join(', ')}</td>
                        </tr>
                    )
                }
            </tbody>
        </table>
    );
}
