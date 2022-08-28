const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;

//Draw and clear player.
function showPlayer(player) {

    var currentCell = document.getElementById(`[${player.mapPosition[0]}][${player.mapPosition[1]}]`);
    currentCell.innerHTML = player.canvasSymbol;
    currentCell.style.fontWeight = "900";
    currentCell.style.opacity = "1";
}
function clearPlayer(player, mapArray) {
    var previousCell = document.getElementById(`[${player.mapPosition[0]}][${player.mapPosition[1]}]`);
    var cellEntity = mapArray[player.mapPosition[0]][player.mapPosition[1]];
    previousCell.innerHTML = cellEntity.symbol;
    //NOTE: this may change as more room types are added.
    previousCell.style.opacity = "0.5";
    if (cellEntity instanceof PathCell) {
        previousCell.style.fontWeight = "400";
    }
}

function initializeGame() {
    //create map for new room.
    var mapWidth = 31, mapHeight = 31;
    var maxTunnels = 80, maxLength = 10;
    var mapArray = generateNewRoom(game.currentRoom, mapWidth, mapHeight, maxTunnels, maxLength);

    //init player
    var player = new Player(10, "@");
    player.getInitialPosition(mapWidth, mapHeight);
    showPlayer(player);

    //Input handler.
    document.addEventListener("keydown", keyDownHandler.bind(null, mapArray, player), false);
}