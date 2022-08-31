const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;

//Display position listeners.
function setHoverListener(mapArray) {
    var boardRows = document.getElementById("gamePage__gameSpace__map").children;

    for (var i = 0; i < boardRows.length; i++) { //for each row div:
        let rowCells = boardRows[i].children;
        for (var j = 0; j < rowCells.length; j++) { //for each column cell in a row:
            let cell = rowCells[j];
            cell.addEventListener("mouseover", function () { //this updates the display according to cell id.
                let tempString = cell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1); //get cell coords
                let position = tempString.toString().split(/[\[\]\,]/);
                let cellEntity = mapArray[position[0]][position[1]];
                
                document.getElementById("gamePage__footer__position").innerHTML = tempString;
                if(cell.innerHTML != "."){
                    document.getElementById("gamePage__footer__cellName").innerHTML = cellEntity.name;
                } else {
                    document.getElementById("gamePage__footer__cellName").innerHTML = "";
                }
            })
        }
    }
}

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
    var enemy = new Enemy(5, "!", new Attack("basic attack", 1, 2, 0));
    player.getInitialPosition(mapWidth, mapHeight);
    showPlayer(player);

    //Input handler.
    document.addEventListener("keydown", keyDownHandler.bind(null, mapArray, player, enemy), false);
    //Hover listener.
    setHoverListener(mapArray);
}

/*List of attack templates.
new Attack("basic attack", 1, 2, 0);
new Attack("parry", 0, 0, 0, "parry", 3);
new Attack("heavy attack", 3, 4, 1);
*/