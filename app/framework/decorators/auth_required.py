from functools import wraps
from flask import request, session, jsonify

from app.framework.decorators.inject import inject
from app.services.auth_service import AuthService
from jwt import PyJWTError
import jwt
from app import app


def auth_required(level="USER", or_is_current_user=False):
    def auth_required_decorator(func):
        @wraps(func)
        @inject
        def function_wrapper(authService: AuthService, *args, **kwargs):
            token = None

            if 'x-access-tokens' in request.headers:
                token = request.headers['x-access-tokens']

            if 'Authorization' in request.headers:
                token = request.headers['Authorization']

            # Sera enregistré dans les logs du serveur !
            # donc le JWT est exposé.
            # Ne jamais authorisé de passer un token via les query strings
            # TOUJOURS dans le header ou les cookies.
            # if request.args.get('token'):
            #     token = request.args.get('token')

            if not token:
                return jsonify({'error': 'missing token'}), 401

            try:
                token = token.replace('Bearer ', '')
                current_user = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            except PyJWTError as e:
                return jsonify({'error': 'invalid token'}), 401

            session['userid'] = current_user['userid']
            session['userroles'] = current_user['roles']

            authService.set_current_user(current_user)

            if level in current_user['roles']:
                return func(*args, **kwargs)

            if or_is_current_user and current_user['userid'] == kwargs.get('userid'):
                return func(*args, **kwargs)

            return jsonify({'error': 'forbidden'}), 403

        return function_wrapper

    return auth_required_decorator
