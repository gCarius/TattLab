from flask import Blueprint, render_template, request, send_file
import os
#from rembg import remove 
#from PIL import Image


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


@view.route("/remove-bg", methods=["POST"])
def remove_background():
    if "image" not in request.files:
        return "No file part", 400
    
    file = request.files["image"]
    
    if file.filename == "":
        return "No selected file", 400
    
    # output_file = remove(file)
    # file_path = os.path.join("website/uploads", file.filename)
    # output_file.save(file_path)

    # Open image and process it
    #input_image = Image.open(file).convert("RGBA")
    #output_image = remove(input_image)

    # Save to processed folder
    processed_path = os.path.join("website/processed", file.filename)
    #output_image.save(processed_path, format="PNG")

    # Return processed image
    return send_file(processed_path, mimetype="image/png")