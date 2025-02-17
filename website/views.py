from flask import Blueprint, render_template, request, Response
import os, datetime, pyautogui
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

@view.route('/take_screenshot', methods=['POST'])
def take_screenshot():
    try:
        # Get user's Downloads folder
        downloads_folder = os.path.join(os.path.expanduser("~"), "Downloads")

        # Save the screenshot in the Downloads folder
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        screenshot_path = os.path.join(downloads_folder, f"screenshot_{timestamp}.png")
        screenshot = pyautogui.screenshot()
        screenshot.save(screenshot_path)

        return Response("true", status=200)
    except Exception as e:
        print(f"Error: {e}")  # Log error for debugging
        return Response("false", status=500)
