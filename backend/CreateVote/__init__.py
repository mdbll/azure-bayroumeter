import azure.functions as func
import os, json
from azure.cosmos import CosmosClient, exceptions

# Connexion Cosmos
COSMOS_ENDPOINT = os.environ["COSMOS_ENDPOINT"]
COSMOS_KEY = os.environ["COSMOS_KEY"]
DB_NAME = os.environ["COSMOS_DATABASE"]
USERS_CONTAINER = os.environ["COSMOS_USERS_CONTAINER"]
VOTES_CONTAINER = os.environ["COSMOS_VOTES_CONTAINER"]

client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
db = client.get_database_client(DB_NAME)
users = db.get_container_client(USERS_CONTAINER)
votes = db.get_container_client(VOTES_CONTAINER)

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Corps JSON invalide", status_code=400)

    user_id, choice = body.get("user_id"), body.get("choice")

    if not user_id or choice not in ["Oui", "Non"]:
        return func.HttpResponse("Paramètres manquants ou choix invalide", status_code=400)

    # Vérifier que l’utilisateur existe
    try:
        users.read_item(item=user_id, partition_key=user_id)
    except exceptions.CosmosResourceNotFoundError:
        return func.HttpResponse("Utilisateur non trouvé", status_code=404)

    # Création du vote
    vote_doc = {
        "id": f"{user_id}-{choice}",  # id unique
        "userId": user_id,            # partitionKey
        "choice": choice
    }

    votes.upsert_item(vote_doc)

    return func.HttpResponse(
        json.dumps(vote_doc),
        mimetype="application/json",
        status_code=201
    )
