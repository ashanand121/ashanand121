"""
API utilities.
"""
import re
import requests
import xml.etree.ElementTree as ET
import xmltodict
import json
import threading
import time
from datetime import datetime
from requests_oauthlib import OAuth1
import json
from flask import current_app as app

fields = ["Component", "Severity", "DE-priority", "Status", "DE-manager", "DIRECTOR",
          "Engineer", "Submitter-id", "Headline", "Version", "Found", "Attribute", "Released-code", "ENCL-RNE_QC", "ENCL-Release-note"]
rneqc_status_list = ['----', 'RNEQC-update-requested',
                     'RNEQC-updated', 'RNEQC-review-completed', 'RNEQC-excellent-RNE']

BUGS_DATA = []
tidx = 0


def get_live_qddts_data(qddts_query):
    global BUGS_DATA
    global tidx
    tidx += 1
    try:
        # with app.app_context():
        #     qddts_api_query = app.config["QDDTS_API"].format(
        #         qddts_query=qddts_query, fields=','.join(fields))

        qddts_api_query = "http://wwwin-metrics.cisco.com/cgi-bin/ws/ws_ddts_query_new.cgi?expert={qddts_query}&fields={fields}".format(
            qddts_query=qddts_query, fields=','.join(fields))
        response = requests.request("GET", qddts_api_query)
        data = json.loads(response.content.decode("utf-8", "ignore"))
        # log(data["bugs"][0]["ENCL-RNE_QC"])
        BUGS_DATA.extend(data["bugs"])

    except Exception as e:
        error = "Error in get_live_qddts_data() : {0}".format(e)
        log(error)
        return error


def get_qddts_queries_from_scrubber(scrubber_data):
    query = "Identifier:"
    query_list = []

    # Calculate the no of bugs in each query
    x = int(len(scrubber_data['bug']) / app.config["NO_OF_THREADS"]) + (
        1 if len(scrubber_data['bug']) % app.config["NO_OF_THREADS"] != 0 else 0)
    idx = 0
    for bug in scrubber_data['bug']:
        idx += 1
        if idx <= x:
            query += bug['bugid'] + ','
        else:
            idx = 1
            query_list.append(query[:-1])
            query = "Identifier:{bug},".format(bug=bug['bugid'])
    query_list.append(query[:-1])
    # log("QueryList[0] -> {0}".format(query_list[0]))
    return query_list


def create_threads(query_list):
    global BUGS_DATA
    global tidx
    tidx = 0
    BUGS_DATA = []
    THREAD_COUNT = len(query_list) if app.config["NO_OF_THREADS"] > len(
        query_list) else app.config["NO_OF_THREADS"]

    class myThread (threading.Thread):
        def __init__(self, qddts_query):
            threading.Thread.__init__(self)
            self.qddts_query = qddts_query

        def run(self):
            start = time.time()
            global tidx
            get_live_qddts_data(self.qddts_query)
            print("TIMER <get_live_qddts_data> from Thread <{1}>: {0} s".format(
                time.time() - start, self.qddts_query))

    threads = []
    for query in query_list:
        #     group.append(query)
        # for g in group:
        threads.append(myThread(query))
    log("Thread Count {0}".format(len(threads)))

    # Start new Threads
    for t in threads:
        t.start()

    # Wait for threads to be over
    for t in threads:
        t.join()

    return BUGS_DATA


def format_buglist_to_scrubber_data(bug_list):
    scrubber_data = {
        "bug": []
    }
    # log("BUGs {0}".format(bug_list))
    for bug in bug_list:
        item = {
            "bugid": bug
        }
        # log(item)
        scrubber_data['bug'].append(item)
    return scrubber_data


def create_query_list(query):
    temp_srubberid = ''
    if 'CSC' not in query:          # <query> is a scrubber
        # Call the scrubber API
        log("Fetching from Scrubber id")
        scrubber_api = app.config["SCRUBBER_API"].format(
            scrubber_id=query)

        start = time.time()
        response = requests.request("GET", scrubber_api)
        log("TIMER <scrubber_api> : {0} s".format(time.time() - start))
        if response.status_code == 200:
            scrubber_data = response.json()
            scrubber_data = scrubber_data[query]
            temp_srubberid = query
        else:
            log("Scrubber API FAILED | {scrubber_api}".format(
                scrubber_api=scrubber_api))
            return []

    else:                           # <query> is a bug or a list of bugs
        log("Fetching from List of bug ids")
        bug_list = re.findall(r'CSC[a-z]{2}[0-9]{5}', query)
        scrubber_data = format_buglist_to_scrubber_data(bug_list)

    start = time.time()
    query_list = get_qddts_queries_from_scrubber(scrubber_data)
    log("TIMER <creating_qddts_queries> : {0} s".format(time.time() - start))
    return query_list,temp_srubberid


def fetch_data(query):
    """
    For fetching data
    """

    query_list,valid_scrubberid = create_query_list(query)

    start = time.time()
    data = create_threads(query_list)
    log("TIMER <getting_qddts_data> : {0} s".format(
        time.time() - start))
    return {
        "bugs": data,
        "rneqc_status_list": rneqc_status_list,
        "valid_scrubberid": valid_scrubberid
    }


def log(msg):
    print()
    print('*'*30)
    print("    {msg}".format(msg=msg))
    print('*'*30)
    print()
