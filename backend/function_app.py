import os, json
import azure.functions as func
from azure.cosmos import CosmosClient, exceptions

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# ---------------------- #
#   Variables d’environnement
# ---------------------- #
COSMOS_ENDPOINT = os.environ["COSMOS_ENDPOINT"]
COSMOS_KEY = os.environ["COSMOS_KEY"]
DB_NAME = os.environ["COSMOS_DATABASE"]
USERS_CONTAINER = os.environ["COSMOS_USERS_CONTAINER"]
VOTES_CONTAINER = os.environ["COSMOS_VOTES_CONTAINER"]

# ---------------------- #
#   Connexion CosmosDB
# ---------------------- #
client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
db = client.get_database_client(DB_NAME)
users = db.get_container_client(USERS_CONTAINER)
votes = db.get_container_client(VOTES_CONTAINER)


# ---------------------- #
#   ENDPOINTS
# ---------------------- #

@app.route(route="user", methods=["POST"])
def create_user(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Corps JSON invalide", status_code=400)

    pseudo, email = body.get("pseudo"), body.get("email")

    if not pseudo or not email:
        return func.HttpResponse("Pseudo et email requis", status_code=400)

    # Vérifier si l'utilisateur existe déjà
    try:
        users.read_item(item=email, partition_key=email)
        # Si aucun exception → l'utilisateur existe déjà
        return func.HttpResponse(
            "Utilisateur déjà existant",
            status_code=409
        )
    except exceptions.CosmosResourceNotFoundError:
        # Utilisateur n'existe pas → on le crée
        doc = {
            "id": email,
            "pseudo": pseudo,
            "email": email
        }

        users.create_item(doc)

        return func.HttpResponse(
            json.dumps(doc),
            mimetype="application/json",
            status_code=201
        )


@app.route(route="vote", methods=["POST"])
def create_vote(req: func.HttpRequest) -> func.HttpResponse:
    body = req.get_json()
    user_id, choice = body.get("user_id"), body.get("choice")

    if not user_id or choice not in ["Oui", "Non"]:
        return func.HttpResponse("Paramètres manquants ou choix invalide", status_code=400)

    # Vérifier que l’utilisateur existe
    try:
        users.read_item(item=user_id, partition_key=user_id)
    except exceptions.CosmosResourceNotFoundError:
        return func.HttpResponse("Utilisateur non trouvé", status_code=404)

    # Ici la partition key du container votes est /userId
    vote_doc = {
        "id": f"{user_id}-{choice}",  # id unique (user + choix)
        "userId": user_id,            # partitionKey
        "choice": choice
    }

    # Cosmos déduit la partitionKey automatiquement à partir de "userId"
    votes.upsert_item(vote_doc)

    return func.HttpResponse(
        json.dumps(vote_doc),
        mimetype="application/json",
        status_code=201
    )


@app.route(route="votes", methods=["GET"])
def get_votes(req: func.HttpRequest) -> func.HttpResponse:
    items = list(votes.read_all_items())
    return func.HttpResponse(
        json.dumps(items),
        mimetype="application/json",
        status_code=200
    )


@app.route(route="login", methods=["POST"])
def login(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Corps JSON invalide", status_code=400)

    email = body.get("email")
    if not email:
        return func.HttpResponse("Email requis", status_code=400)

    # Vérifier si l’utilisateur existe
    try:
        user_doc = users.read_item(item=email, partition_key=email)
    except exceptions.CosmosResourceNotFoundError:
        return func.HttpResponse("Utilisateur non trouvé", status_code=404)

    # Retourner les infos utilisateur
    return func.HttpResponse(
        json.dumps(user_doc),
        mimetype="application/json",
        status_code=200
    )
