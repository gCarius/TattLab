from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "tattlab"
    
    @app.route("/")
    def home():
        return "<h1>Hello World!!!<h1>"

    return app
