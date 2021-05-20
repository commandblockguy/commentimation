from __future__ import print_function
import json
from apiclient import discovery
from httplib2 import Http
from oauth2client import client
from oauth2client import file
from oauth2client import tools

# Gets a list of comment anchors from a Google Doc
# You can dump these into the web thing using the console, if the macro starts to get so laggy it breaks

# Set doc ID, as found at `https://docs.google.com/document/d/YOUR_DOC_ID/edit`
DOCUMENT_ID = ''

# Set the scopes and discovery info
SCOPES = 'https://www.googleapis.com/auth/drive.readonly'

# Initialize credentials and instantiate Docs API service
store = file.Storage('token.json')
creds = store.get()
if not creds or creds.invalid:
    flow = client.flow_from_clientsecrets('credentials.json', SCOPES)
    creds = tools.run_flow(flow, store)
service = discovery.build('drive', 'v3', http=creds.authorize(
    Http()))

result = service.comments().list(
	fileId=DOCUMENT_ID, pageSize=100, fields="nextPageToken, comments(anchor)").execute()
anchors = [x.get('anchor') for x in result.get('comments', [])]
pageToken = result.get('nextPageToken')

while pageToken:
	result = service.comments().list(
		fileId=DOCUMENT_ID, pageSize=100, pageToken=pageToken, fields="nextPageToken, comments(anchor)").execute()
	newAnchors = [x.get('anchor') for x in result.get('comments', [])]
	anchors += newAnchors
	pageToken = result.get('nextPageToken')
	print(pageToken)

print(anchors)
