from flask import Blueprint, render_template, request
import os


view = Blueprint("view", __name__)


@view.route("/")
def home():
    return render_template("home.html")

@view.route("/test")
def test():
    return render_template("test.html")

@view.route("/upload", methods=["POST"])
def upload_file():
    if "image" not in request.files:
        return "No file part", 400
    
    file = request.files["image"]
    
    if file.filename == "":
        return "No selected file", 400

    file_path = os.path.join("website/uploads", file.filename)
    file.save(file_path)
    
    return "File uploaded successfully"
