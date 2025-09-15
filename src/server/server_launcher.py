from flask import Flask
from flask_server import FlaskEndpoint

app = Flask(__name__)

def launch_flask_endpoint():
    FlaskEndpoint.register(app, route_base = '/')

def main():
    launch_flask_endpoint()

if __name__ == "__main__":
    main()
    app.run(debug=True)