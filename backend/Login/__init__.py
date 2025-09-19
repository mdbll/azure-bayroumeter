import azure.functions as func
import os, json
from azure.cosmos import CosmosClient, exceptions

COSMOS_ENDPOINT = os.environ["COSMOS_ENDPOINT"]
COSMOS_KEY = os.environ["COSMOS_KEY"]
DB_NAME = os.environ["COSMOS_DATABASE"]
USERS_CONTAINER = os.environ["COSMOS_USERS_CONTAINER"]

client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
db = client.get_database_client(DB_NAME)
users = db.get_container_client(USERS_CONTAINER)

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Corps JSON invalide", status_code=400)

    email = body.get("email")
    if not email:
        return func.HttpResponse("Email requis", status_code=400)

    try:
        user_doc = users.read_item(item=email, partition_key=email)
    except exceptions.CosmosResourceNotFoundError:
        return func.HttpResponse("Utilisateur non trouvé", status_code=404)

    return func.HttpResponse(json.dumps(user_doc), mimetype="application/json", status_code=200)
