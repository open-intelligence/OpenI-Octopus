from flask import Flask, render_template, request
# from flask.ext.restful import Api, Resource

app = Flask(__name__)

@app.route('/', methods=["GET"])
def index():
    # return "hello word"
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=False, threaded=True, port=6009)