const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;

//Draw and clear player.
function showPlayer(player){

    var currentCell = document.getElementById(`[${player.mapPosition[0]}][${player.mapPosition[1]}]`);
    currentCell.innerHTML = player.canvasSymbol;
    currentCell.style.fontWeight = "900";
}
function clearPlayer(player, mapArray){
    var previousCell = document.getElementById(`[${player.mapPosition[0]}][${player.mapPosition[1]}]`);
    var cellEntity = mapArray[player.mapPosition[0]][player.mapPosition[1]];
    previousCell.innerHTML = cellEntity.symbol;
    //NOTE: this may change as more room types are added.
    previousCell.style.fontWeight = "400";
    if(cellEntity instanceof PathCell){
        previousCell.style.opacity = "0.5";
    }
}

function initializeGame(){

    var mapWidth = 31, mapHeight = 31;
    var maxTunnels = 80, maxLength = 10;
    //generate array of walls
    var mapArray = createMapArray(mapWidth, mapHeight);
    //generate random paths procedurally
    mapArray = createMapPaths(maxTunnels, maxLength, mapWidth, mapHeight, mapArray);
    //generate random locations of interest
    var centerCoord = [(mapWidth-1) / 2, (mapHeight-1) / 2];
    mapArray = placeLocation(mapArray, mapWidth-1, mapHeight-1, centerCoord, 0);
    //push complete mapArray to DOM
    pushMapToDOM(mapArray);
    
    //calc all visible nodes. Player position begins at center.
    showCellsInVision(5, centerCoord[0], centerCoord[1], mapArray);

    //init player
    var player = new Player(10, "@");
    player.getInitialPosition(mapWidth, mapHeight);
    showPlayer(player);

    //Input handler.
    document.addEventListener("keydown", keyDownHandler.bind(null, mapArray, player), false);
}