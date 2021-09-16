"""Master application for ESA."""

import json
import os
import subprocess
import time
import requests

from flask import Flask, render_template, request, g, redirect, url_for, session, jsonify
from functools import wraps
from datetime import datetime

from logging.config import dictConfig
from config import Configure
from requests_oauthlib import OAuth1

from utils.cec_authentication import LDAPAuth
import utils.db_helper as DbHelper


user = None
environment = None
user_cec = LDAPAuth()

app = Configure()


def dir_last_updated(folder="static/assets"):
    last_updated = str(max(os.path.getmtime(os.path.join(root_path, f))
                           for root_path, dirs, files in os.walk(folder)
                           for f in files))
    # print("LAST_UPDATED = {0}".format(last_updated))
    return last_updated


def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        global environment
        if environment == "prod":
            print("Login from Production")
            if 'Pi-User' in request.headers:
                log("pi User present")
                g.user = str(request.headers.get('Pi-User'))
                app.config["ACCESS_TOKEN"] = g.user
            else:
                g.user = app.config["ACCESS_TOKEN"]
                if g.user == None or g.user == "":
                    log("g.user is NONE [{0}]".format(g.user))
                    session['url'] = request.url
                    session['message'] = "You need to be logged in"
                    session['status'] = "warning"
                    return redirect('/')
            print("USER : " + g.user)
            app.config['ACCESS_TOKEN'] = g.user
            d = update_statistic(g.user,'')
            return f(*args, **kwargs)
        else:
            print("Login from " + str(environment))
            if 'user' in session:
                if session['user'] != None:
                    g.user = session['user']
                    print("USER : " + g.user)
                    app.config['ACCESS_TOKEN'] = g.user
                    return f(*args, **kwargs)
            else:
                g.user = None
                session['url'] = request.url
                session['message'] = "You need to be logged in"
                session['status'] = "warning"
                return redirect(url_for('login'))

    return wrap


@app.errorhandler(Exception)
def exception_handler(error):
    """Global exception handler."""
    return json.dumps({
        "error": error.args,
        "status": "failed"
    }), 500, {'Content-type': 'application/json'}


@app.route("/login/authenticate/", methods=["POST"])
def authenticate():
    try:
        user = request.form['username']
        password = request.form['password']
        authentic = user_cec.auth(user, password)
        authentic = True
        if authentic:
            session['user'] = user
            g.user = user
            print("USER : " + user)
            app.config['ACCESS_TOKEN'] = g.user
            # session.permanent = True
            session['message'] = "Hi " + user + "! You are now logged in"
            session['status'] = "success"
            d = update_statistic(session['user'],'')
            URL = session.pop('url', '/')
            return redirect(URL)
        else:
            session['message'] = "Invalid Credentials"
            session['status'] = "danger"
            return redirect(url_for('login'))

    except Exception as e:
        return jsonify({'Message': 'Error in Apllication', 'Error': str(e)})

def update_statistic(user,scrubber_id):
    with open('utils/site_statistic.json') as json_file:
        data = json.load(json_file)
    if 'history_scrubberids' in data:
        history_srubbers_list = data['history_scrubberids']
    else:
        history_srubbers_list = []
    if scrubber_id != '':
        if scrubber_id in history_srubbers_list:
            history_srubbers_list.remove(scrubber_id)
        else:
            if len(history_srubbers_list) == 20:
                history_srubbers_list.pop(0)
        history_srubbers_list.append(scrubber_id)
    if user == '':
        new_data = {'stat': {'all_hits': data['stat']['all_hits'] + 1, 'all_login': data['stat']['all_login']}, 'history_scrubberids': history_srubbers_list}
    else:
        # Not incrementing all_hits because this function will get called twice in this case
        new_data = {'stat': {'all_hits': data['stat']['all_hits'], 'all_login': data['stat']['all_login'] + 1}, 'history_scrubberids': history_srubbers_list}
    with open('utils/site_statistic.json', 'w') as json_file:
            json.dump(new_data, json_file)
            json_file.close()
    return new_data


@app.route("/login/")
def login():
    """
    Login Route
    """
    return render_template("login.html", MESSAGE=session.pop('message', None), STATUS=session.pop('status', None))


@app.route('/')
@login_required
def home():
    """
    Home api
    """
    stat_data = update_statistic('','')
    return render_template("home.html",
                           SITE_STATS=stat_data,
                           scrubber_history=stat_data['history_scrubberids'][::-1],
                           USER=g.user,
                           LAST_UPDATED=dir_last_updated())


@app.route('/help')
@login_required
def help():
    """
    Help api
    """
    return render_template("help.html", USER=g.user)


@app.route('/<query>/', methods=['GET'])
@login_required
def show_rne(query):
    """
    Show RNE api
    """
    try:
        user = g.user
        with app.app_context():
            start = time.time()
            data = None
            data = DbHelper.fetch_data(query)
            stat_data = update_statistic('',data["valid_scrubberid"])

            log("TIMER <fetch_data> | {0} s".format(time.time() - start))
            # return data
            return render_template(
                "rne_default_page.html",
                DATA=data,
                RNEQC_STATUS_LIST=data["rneqc_status_list"],
                USER=user,
                SITE_STATS=stat_data,
                scrubber_history = stat_data['history_scrubberids'][::-1],
                LAST_UPDATED=dir_last_updated()
            )
    except Exception as e:
        return render_template('error.html',ERROR="Please provide valid Scrubber-id", USER=g.user)


def log(msg):
    print()
    print('*'*30)
    print("    {msg}".format(msg=msg))
    print('*'*30)
    print()


"""
API Calls
"""


@app.route('/save_rneqc_notes/<bugid>/', methods=['POST', 'PUT'])
@login_required
def save_rneqc_notes(bugid):
    """
    Save RNE_QC notes API
    """

    log("save_rneqc_notes() API called")
    try:

        request_data = request.get_json()
        note = request_data["notes"]

        if request.method == "POST":
            api = app.config['NEW_NOTE_API'].format(bugid=bugid)
            payload = app.config["NEW_NOTE_PAYLOAD"].format(
                note=note, title=app.config["NOTE_TITLE"])

        elif request.method == "PUT":
            api = app.config['ADD_NOTE_API'].format(
                bugid=bugid, title=app.config['NOTE_TITLE']) if request.method == "PUT" else app.config['NEW_NOTE_API'].format(bugid=bugid)
            payload = note
        else:
            raise Exception("Method not supported")

        oauth = OAuth1(app.config['CUSTOMER_KEY'],
                       app.config['CUSTOMER_SECRET'],
                       app.config['ACCESS_TOKEN'],
                       app.config['TOKEN_SECRET'])
        headers = {
            'Content-Type': 'application/xml'
        }

        outbound = {
            "method": request.method,
            "note": note
        }
        response = requests.request(request.method,
                                    api,
                                    data=payload,
                                    headers=headers,
                                    auth=oauth)
        content = (response.content).decode("UTF-8")
        if content == "":
            outbound["status"] = "success"
            outbound["response"] = content
        else:
            outbound["status"] = "failed"
            outbound["error"] = content
        return outbound

    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }


@app.route('/save_attribute/<bugid>/', methods=['PUT'])
@login_required
def save_attribute(bugid):
    """
    Save Attribute API
    """

    log("save_attribute() API called")
    try:

        request_data = request.get_json()
        attribute = request_data["attribute"]

        if request.method != "PUT":
            raise Exception("Method not supported")

        api = app.config['ADD_ATTRIBUTE_API'].format(
            bugid=bugid, title=app.config['NOTE_TITLE']) if request.method == "PUT" else app.config['NEW_NOTE_API'].format(bugid=bugid)
        payload = app.config['ADD_ATTRIBUTE_PAYLOAD'].format(
            bugid=bugid, attribute=attribute)
        oauth = OAuth1(app.config['CUSTOMER_KEY'],
                       app.config['CUSTOMER_SECRET'],
                       app.config['ACCESS_TOKEN'],
                       app.config['TOKEN_SECRET'])
        headers = {
            'Content-Type': 'application/xml'
        }

        outbound = {
            "method": request.method,
            "attribute": attribute
        }
        response = requests.request(request.method,
                                    api,
                                    data=payload,
                                    headers=headers,
                                    auth=oauth)
        content = (response.content).decode("UTF-8")
        if content == "":
            outbound["status"] = "success"
            outbound["response"] = content
        else:
            outbound["status"] = "failed"
            outbound["error"] = content
        return outbound

    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }


@app.route('/save_rne/', methods=['PUT'])
@login_required
def save_rne():
    """Save RNE data.
    """
    # Save new RNE details.
    data = request.get_json()
    log(data)

    try:
        api = app.config['ADD_RNE_API'].format(bugid=data["bugid"])
        headers = {
            'Content-Type': 'application/xml'
        }
        payload = app.config["ADD_RNE_PAYLOAD"].format(bugid=data["bugid"], symptoms=data["symptoms"], conditions=data["conditions"], workaround=data["workaround"],
                                                       description=data["description"], rneFlag=data["rneFlag"], headline=data["headline"])
        # Creating Oauth connection.
        oauth = OAuth1(app.config['CUSTOMER_KEY'],
                       app.config['CUSTOMER_SECRET'],
                       app.config['ACCESS_TOKEN'],
                       app.config['TOKEN_SECRET'])

        outbound = {
            "method": request.method,
            "data": data
        }
        response = requests.request(request.method,
                                    api,
                                    data=payload,
                                    headers=headers,
                                    auth=oauth)
        content = (response.content).decode("UTF-8")
        if content == "":
            outbound["status"] = "success"
            outbound["response"] = content
        else:
            outbound["status"] = "failed"
            outbound["error"] = content
        return outbound

    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }

@app.route('/get_user_scrubber_list/', methods=['POST'])
@login_required
def get_user_scrubber_list():
    searched_data = request.get_json()
    print("Searched User:- ",searched_data['user'])
    try:
        api = app.config['SEARCH_SCRUBBER_API'].format(searched_user=searched_data["user"])
        response = requests.request("GET",
                                api,
                                data={},
                                headers={})

        data = json.loads(response.text)

        if data['status'] != 'success':
            return {
                "status": "failed",
                "error": str(data['error'])
            }
        else:
            if len(data[searched_data["user"]]) == 0:
                return {"scrubber_list": []}
            else:
                temp_list = []
                for d in data[searched_data["user"]]:
                    temp_list.append(d['datafile']+": "+d['name'])
                return {"scrubber_list": temp_list}
    except Exception as e:
        print(e)
        return {
            "status": "failed",
            "error": str(e)
        }


if __name__ == '__main__':
    app.logger.info("* Starting RNE-QC application ...")
    query = "export PYTHONIOENCODING=utf8"
    process = subprocess.Popen(
        query, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    with app.app_context():
        app.jinja_env.cache = {}
        # app.jinja_env.trim_blocks = True
        # app.jinja_env.lstrip_blocks = True
        environment = os.getenv("ENV", "stage")
        if environment == "prod":
            app.run(debug=False, host='0.0.0.0', port=5000)
        elif environment == "local":
            app.run(debug=True, host='127.0.0.1', port=4000)
        elif environment == "stage":
            app.run(debug=True, host='0.0.0.0', port=4000)
