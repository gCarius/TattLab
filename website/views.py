from flask import Blueprint, render_template

view = Blueprint("view", __name__)


@view.route("/")
def home():
    return render_template("home.html")

@view.route("/test")
def test():
    return render_template("test.html")
