"""
Controller of RNEQC application.
"""

from flask import Flask
from flask_cors import CORS


def Configure():
    app = Flask(__name__)
    app.secret_key = b'8\xd5\xa2n2L"Foom8z\n\xeca@d]/'
    app.url_map.strict_slashes = False
    app.config["APP_CONTEXT"] = app.app_context()

    # cdets apis.
    app.config['NOTE_TITLE'] = "RNE_QC"
    app.config['NEW_NOTE_API'] = "https://cdetsng.cisco.com/wsapi/latest/api/bug/{bugid}/note"
    app.config['NEW_NOTE_PAYLOAD'] = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
                                        <Note xmlns="cdetsng" xmlns:ns1="http://www.w3.org/1999/xlink">
                                            <Field name="Note">{note}</Field>
                                            <Field name="Title">{title}</Field>
                                            <Field name="Type">D-comments</Field>
                                        </Note>"""
    app.config['ADD_NOTE_API'] = "https://cdetsng.cisco.com/wsapi/latest/api/bug/{bugid}/note/{title}"
    app.config['ADD_RNE_API'] = "https://cdetsng.cisco.com/wsapi/latest/api/bug/{bugid}/"
    app.config['ADD_RNE_PAYLOAD'] = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
                                        <ns2:Defect xmlns:ns2="cdetsng" xmlns:ns1="http://www.w3.org/1999/xlink" id=\"{bugid}\">
                                            <ns2:Field name="RNE_Type">{rneFlag}</ns2:Field>
                                            <ns2:Field name="Symptoms">{symptoms}</ns2:Field>
                                            <ns2:Field name="Conditions">{conditions}</ns2:Field>
                                            <ns2:Field name="Workarounds">{workaround}</ns2:Field>
                                            <ns2:Field name="Further-Problem-Description">{description}</ns2:Field>
                                            <ns2:Field name="Headline">{headline}</ns2:Field>
                                        </ns2:Defect>"""
    app.config['CDETS_API'] = "https://cdetsng.cisco.com/wsapi/latest/api/bug/{bugid}/"
    app.config[
        'ADD_ATTRIBUTE_API'] = "https://cdetsng.cisco.com/wsapi/latest/api/bug/{bugid}"
    app.config["ADD_ATTRIBUTE_PAYLOAD"] = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
                                                <ns2:Defect xmlns:ns2="cdetsng" xmlns:ns1="http://www.w3.org/1999/xlink" id="{bugid}">
                                                    <ns2:Field name="Attribute">{attribute}</ns2:Field>
                                                </ns2:Defect>"""
    app.config[
        'QDDTS_API'] = "http://wwwin-metrics.cisco.com/cgi-bin/ws/ws_ddts_query_new.cgi?expert={qddts_query}&fields={fields}"
    app.config[
        'SCRUBBER_API'] = "https://wwwin-ottawa.cisco.com/tfoggoa/Scrubber/api/queries/{scrubber_id}"
    app.config['SEARCH_SCRUBBER_API'] = "https://wwwin-ottawa.cisco.com/tfoggoa/Scrubber/api/users/{searched_user}"
    app.config['CUSTOMER_KEY'] = "a5c54e1b-8a5c-4a99-a24d-95041913df80"
    app.config['CUSTOMER_SECRET'] = "TnLNrtfeW5k05d3PFRAFD8nTSKAVlWq6"
    app.config['TOKEN_SECRET'] = "TnLNrtfeW5k05d3PFRAFD8nTSKAVlWq6"
    app.config['ACCESS_TOKEN'] = ''  # to be assigned on login
    app.config['NO_OF_THREADS'] = 31  # (2 * cores - 1)

    CORS(app)

    return app
