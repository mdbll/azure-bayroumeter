import azure.functions as func
import os, json
from azure.cosmos import CosmosClient

# Connexion Cosmos
COSMOS_ENDPOINT = os.environ["COSMOS_ENDPOINT"]
COSMOS_KEY = os.environ["COSMOS_KEY"]
DB_NAME = os.environ["COSMOS_DATABASE"]
VOTES_CONTAINER = os.environ["COSMOS_VOTES_CONTAINER"]

client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
db = client.get_database_client(DB_NAME)
votes = db.get_container_client(VOTES_CONTAINER)

def main(req: func.HttpRequest) -> func.HttpResponse:
    items = list(votes.read_all_items())
    return func.HttpResponse(
        json.dumps(items),
        mimetype="application/json",
        status_code=200
    )
