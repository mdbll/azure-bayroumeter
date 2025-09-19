import logging
import azure.functions as func
import os, json
from azure.cosmos import CosmosClient, exceptions

# Init Cosmos DB (idéalement factorisé dans un module utils)
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

    pseudo, email = body.get("pseudo"), body.get("email")
    if not pseudo or not email:
        return func.HttpResponse("Pseudo et email requis", status_code=400)

    # Vérifier si utilisateur existe
    try:
        users.read_item(item=email, partition_key=email)
        return func.HttpResponse("Utilisateur déjà existant", status_code=409)
    except exceptions.CosmosResourceNotFoundError:
        doc = {"id": email, "pseudo": pseudo, "email": email}
        users.create_item(doc)
        return func.HttpResponse(json.dumps(doc), mimetype="application/json", status_code=201)
