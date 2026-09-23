import datetime

import jwt

from app.framework.decorators.auth_required import auth_required
from app.framework.decorators.inject import inject
from app.services.role_service import RoleService
from app.services.user_service import UserService
from app import app
from flask import request, jsonify
from app.forms.user.user_register_form import UserRegisterForm
from app.forms.user.user_login_form import UserLoginForm
from app.forms.user.user_update_form import UserUpdateForm


@app.route('/api/users')
@auth_required()
@inject
def getUserList(user_service: UserService):
    return jsonify([user.get_json_parsable() for user in user_service.find_all()])


@app.route('/api/users/<int:userid>', methods=["GET"])
@auth_required()
@inject
def getOneUser(userid: int, user_service: UserService):
    user = user_service.find_one(userid)

    return jsonify(user.get_json_parsable())


@app.route('/api/users/register', methods=["POST"])
@inject
def register(userService: UserService):
    form = UserRegisterForm.from_json(request.json)

    if form.validate():
        user = userService.insert(form)

        return jsonify(user.get_json_parsable())

    return jsonify(form.errors)


@app.route('/api/users/<int:userid>', methods=["PUT"])
@auth_required(level="ADMIN", or_is_current_user=True)
@inject
def userUpdate(userid: int, userService: UserService, roleService: RoleService):
    form = UserUpdateForm.from_json(request.json)

    if form.validate():
        user = userService.update(userid, form)

        return jsonify(user.get_json_parsable())

    return jsonify(form.errors)


@app.route('/api/login', methods=["POST"])
@inject
def login(userService: UserService):
    form = UserLoginForm.from_json(request.json)

    if form.validate():
        user = userService.login(form)

        if user is not None:
            token = jwt.encode({
                # Exposait le hash du password dans le token
                # via get_json_parsable() qui vient du user_dto
                # En général on évite d'exposer plus que ce qui est nécessaire dans le token
                # Donc en gros userid/roles
                # 'user': user.get_json_parsable(),
                'userid': user.userid,
                'username': user.username,
                'roles': user.get_roles(),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=45)
            },
                app.config['SECRET_KEY'],
                "HS256")

            return jsonify({'token': token})

        errors = {'authentication': 'Wrong user or password!'}

        return jsonify(errors)

    return jsonify(form.errors)
