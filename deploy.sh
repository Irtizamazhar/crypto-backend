TAG_PREFIX="production-"
current_epoch=$(date +%s)
TAG="${TAG_PREFIX}$current_epoch"  # Prepends the environment prefix to the tag
echo $TAG

PROFILE="meraki"
REGION="eu-west-2"
CLUSTER="prod-serenabeds-cluster"
CONTAINER="serenabeds-api"
SERVICE_NAME="serenabeds-api"
TASK_DEFINITION_FAMILY="production-serenabeds-api"
IMAGE_URL="597088036187.dkr.ecr.eu-west-2.amazonaws.com/serenabeds-backend-api"
NEW_IMAGE_TAG="$IMAGE_URL:$TAG"

aws --profile $PROFILE ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 597088036187.dkr.ecr.eu-west-2.amazonaws.com
docker build -t serenabeds-backend-api .
docker tag serenabeds-backend-api:latest 597088036187.dkr.ecr.eu-west-2.amazonaws.com/serenabeds-backend-api:$TAG
docker push 597088036187.dkr.ecr.eu-west-2.amazonaws.com/serenabeds-backend-api:$TAG

TASK_DEFINITION=$(aws --profile $PROFILE ecs describe-task-definition --task-definition "$TASK_DEFINITION_FAMILY" --region "$REGION")
NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$NEW_IMAGE_TAG" '.taskDefinition | .containerDefinitions[0].image = $IMAGE  | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')
NEW_REVISION1=$(aws --profile $PROFILE ecs register-task-definition --region "$REGION" --cli-input-json "$NEW_TASK_DEFINITION")
NEW_REVISION=$(echo $NEW_REVISION1 | jq -r '.taskDefinition.taskDefinitionArn')

NEW_SERVICE=$(aws --profile $PROFILE ecs update-service --cluster $CLUSTER --service $SERVICE_NAME --task-definition $NEW_REVISION --force-new-deployment --region "$REGION")
echo $NEW_REVISION
echo "done"