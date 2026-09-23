from app import app
from flask import jsonify
from app.models.user import User


@app.route('/', methods=['GET'])
def index():
    return jsonify({'app': 'shop-api', 'status': 'ok'})
