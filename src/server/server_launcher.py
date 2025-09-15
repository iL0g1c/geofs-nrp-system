from flask import Flask

app = Flask(__name__)

def launch_flask_endpoint():
    FlaskEndpoint.register(app, route_base = '/')

def main():
    launch_flask_endpoint()

if __name__ == "__main__":
    main()
    app.run(debug=True)