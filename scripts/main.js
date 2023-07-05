const windowDirectory = ["map", "encounter", "shop"];
const windowTitles = ["THE DREAM", "THE WAR ROOM", "THE WISHING WELL"];
var currentWindowIndex = 0;
var player;
var enemy;
var mapArray; //this is global now. It was too hard to keep encapsulated. Required for player masquerade.
var mapWidth = 31, mapHeight = 31;

class Game {
    constructor() {
        this.gameState = 0;
        this.windowState = 1;
        /*
        0 - dialogue, win/end pages ||| disable movement keys, attack keys
        1 - movement                ||| disable                attack keys
        2 - encounter               ||| disable movement keys            
        3 - shop                    ||| disable movement keys, attack keys
        */

        this.currentRoom = 1;
    }
    //Begin a new turn each time the player moves.
    /*
    Needs to:
    - hide everything
    - move player
    - move enemies
    - display vision
    - check for special locations
    */
    async turnHandler(map, player, mapHandler, e){
        map.hideCells();
        
        //Show Tower vision.
        for(let i = 0; i < map.towerArray.length; i++){
            if(map.towerArray[i].active){
                map.towerArray[i].showTowerVision();
            }
        }

        this.playerMovementHandler(map.mapArray, player, mapHandler, e.code);
        //^ handles moving the player and showing the player!
    }
    async changeWindow(newWindowState){
        this.windowState = newWindowState;
        switch(this.windowState){
            case 0:
                break;
            case 1:
                document.getElementById("gamePage__gameSpace__map").style.display = "block";
                document.getElementById("gamePage__gameSpace__combat").style.display = "none";
                document.getElementById("gamePage__gameSpace__shop").style.display = "none";
                break;
            case 2:
                document.getElementById("gamePage__gameSpace__map").style.display = "none";
                document.getElementById("gamePage__gameSpace__combat").style.display = "block";
                document.getElementById("gamePage__gameSpace__shop").style.display = "none";
                break;
            case 3:
                document.getElementById("gamePage__gameSpace__map").style.display = "none";
                document.getElementById("gamePage__gameSpace__combat").style.display = "none";
                document.getElementById("gamePage__gameSpace__shop").style.display = "block";
                break;
        }
    }

    async playerMovementHandler(mapArray, player, mapHandler, key) {
        //very cool directions array! Append each element instead of having 4 switch statements.
        //[left] [right] [up] [down]
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]],
            newDirection;

        //Cells to update
        let currentCell = mapArray[player.position[0]][player.position[1]],
            nextCellPos;

            
        //Make an array [x][y] of position. .filter removes whitespace from split.
        let currentCellPos = currentCell.cellID.split(/[\[\]]/).filter(element => element.length >= 1);
        //deltapos depending on key pressed.
        switch (key) {
            case "KeyW":
                newDirection = directions[2];
                break;
            case "KeyA":
                newDirection = directions[0];
                break;
            case "KeyS":
                newDirection = directions[3];
                break;
            case "KeyD":
                newDirection = directions[1];
                break;
        }

        //Find the next cell.
        nextCellPos = [parseInt(currentCellPos[0]) + newDirection[0], parseInt(currentCellPos[1]) + newDirection[1]];
        let newCell, newCellEntity;

        if ((nextCellPos[0] < mapArray.length && nextCellPos[1] < mapArray[0].length) && (nextCellPos[0] >= 0 && nextCellPos[1] >= 0)) { //check for out of bounds. //Not working.
            newCell = document.getElementById(`[${nextCellPos[0]}][${nextCellPos[1]}]`);
            let tempPosition = newCell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1);
            newCellEntity = mapArray[tempPosition[0]][tempPosition[1]];
        }

        //Move the player.
        if (newCell != null && newCellEntity instanceof WallCell == false) {
            //if the new cell is a hidden boss room, exit.
            //if (newCellEntity instanceof BossEncounterCell && !newCellEntity.revealed) { return; }
            //Update previous cell.
            mapHandler.clearPlayer(mapArray);
            player.updatePosition(nextCellPos[0], nextCellPos[1]);
            

            //Proc encounters!!!
            /*if (newCellEntity) {
                newCellEntity.visit();
            }*/
        }
        //Show the player.
        mapHandler.showPlayer(player);
    }
    async keyDownHandler(map, player, mapHandler, e) {
        if (e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA") {
            this.turnHandler(map, player, mapHandler, e);
        }
    }

}
class MapHandler {
    constructor(mapWidth, mapHeight, maxTunnels, maxLength) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.maxTunnels = maxTunnels;
        this.maxLength = maxLength;

        this.mapEntity = document.getElementById("gamePage__gameSpace__map__canvas");
        this.mapArray;

        this.towerArray = []; //Add Towers to this Array. in showTowerRange(), loop through this and showCellsInVision these Towers.
    }
    generateNewRoom(game) {
        //generate array of walls
        this.mapArray = this.createMapArray(game);
        //generate random paths procedurally
        this.mapArray = this.createMapPaths();

        //Array defining how many rooms of each type exist.
        let roomTypeArray;
        switch (game.currentRoom) {
            //CONVENTION: [LOCATIONS, ENEMIES, BOSSES, SPECIAL]
            //always 1 boss.
            case 1:
                roomTypeArray = [10, 5, 1, 2];
                break;
            case 2:
                break;
        }
        //generate random locations of interest
        for (var i = 0; i < 3; i++) { // MINOR
            /*
            Reinstate this when ready to place location blocks.
            this.mapArray = placeLocation(this.mapArray, this.mapWidth - 1, this.mapHeight - 1, centerCoord, "Minor");
            */
           this.mapArray = this.placeLocation("Tower")
        }
        for( var j = 0; j < this.towerArray.length; j++){
            this.towerArray[j].activateTower();
        }
        //push complete mapArray to DOM
        this.pushMapToDOM(this.mapArray);

        return this.mapArray;
    }
    //This creates and fills an array with WallCells.
    createMapArray(game) {
        var array = [];
        for (var i = 0; i < this.mapWidth; i++) {
            array.push([]); //push columns.
            for (var j = 0; j < this.mapHeight; j++) {
                array[i].push(new WallCell(i, j, game.currentRoom)); //push cells.
            }
        }
        return array;
    }
    //This replaces some of the WallCells with PathCells.
    createMapPaths() {
        //very cool directions array! Append each element instead of having 4 switch statements.
        //                [left]   [right] [up]     [down]
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        //Store the previous direction drawn here. Can't go forward or backward, needs to pick a different direction.
        //Random direction to generate.
        let lastDirection = [],
            randomDirection;

        //Step 1: Random initial position.
        /*let currentRow = randInt(dimensions, "floor");
        currentColumn = randInt(dimensions, "floor");*/
        let currentRow = Math.ceil(this.mapHeight / 2);
        let currentColumn = Math.ceil(this.mapWidth / 2);

        while (this.maxTunnels > 0) {
            //Step 2: Random direction.
            //       Do-While for not same direction or opposite it. (Needs to be perpendicular.)
            do {
                //Pick a random direction from array.
                randomDirection = directions[randInt(directions.length - 1)]
            } while (
                //If direction picked is parallel to previous direction, keep generating.
                //              comparing x-coords                  comparing y-coords
                (randomDirection[0] === -lastDirection[0] && randomDirection[1] === -lastDirection[1]) || //<-- opposite direction but parallel; note the "-"
                (randomDirection[0] === -lastDirection[0] && randomDirection[1] === lastDirection[1]) //    <-- same direction.
            );
            //Step 3: Random tunnel length from 1-maxLength
            let randomLength = Math.ceil(Math.random() * this.maxLength),
                tunnelLength = 0; //tunnelLength is an iterator.

            //Drawing the map:
            //Step 4: Stop drawing if hit edge of map.
            while (tunnelLength < randomLength) {
                //checks each tile.
                if (((currentRow === 0) && (randomDirection[1] === -1)) ||
                    ((currentColumn === 0) && (randomDirection[0] === -1)) ||
                    ((currentRow === this.mapHeight - 1) && (randomDirection[1] === 1)) ||
                    ((currentColumn === this.mapWidth - 1) && (randomDirection[0] === 1))) { break; } //Break loop.
                else {
                    //Step 5: Update map if everything else is valid.
                    this.mapArray[currentColumn][currentRow] = new PathCell(currentColumn, currentRow); //Update tile

                    currentColumn += randomDirection[0]; //iterate tile
                    currentRow += randomDirection[1];
                    tunnelLength++;
                }
            }
            //Step 6: Cleanup and update for the next tunnel.
            if (tunnelLength >= 1) {
                lastDirection = randomDirection;
                this.maxTunnels--;
            }
        }

        return this.mapArray;
    }
    //Place locations at random positions.
    placeLocation(type) {
        let centerCoord = [Math.ceil(this.mapWidth/2), Math.ceil(this.mapHeight/2)];

        let pathFound = false;
        while (!pathFound) {
            var randomCoord = [0, 0]; //This, randomly generated, is possible position for location.
            randomCoord[0] = randInt(this.mapWidth - 1);
            randomCoord[1] = randInt(this.mapHeight - 1);
    
            //Validate if above position is accessible.
            //check if one of the neighbouring tiles instanceof PathCell.
            //iterate through adjacent cells.
            for (let x = Math.max(0, randomCoord[0] - 1); x <= Math.min(this.mapWidth - 1, randomCoord[0] + 1); x++) { //Math.min and Math.max specifies boundaries.
                for (let y = Math.max(0, randomCoord[1] - 1); y <= Math.min(this.mapHeight - 1, randomCoord[1] + 1); y++) {
                    //console.log(`[${randomCoord[0]}][${randomCoord[1]}]`)

                    //randomCoord is the chosen location. X, Y are coords around it.
                    //Check 1: Not the targeted tile.                      Also not corners. (Only on same plane x, y)
                    if (((x != randomCoord[0] || y != randomCoord[1]) && (x == randomCoord[0] || y == randomCoord[1])) && this.mapArray[x][y] instanceof PathCell) { //<-- if there is a valid pathcell around it.
                        //RANDOMCOORD IS THE LOCAITONCELL POSITION.
                        //X AND Y ARE PATH CHECKS.

                        //This is the actual test part. Scalability comes from here!
                        switch (type) {
                            case "Tower":
                                if((this.mapArray[randomCoord[0]][randomCoord[1]] instanceof WallCell||this.mapArray[randomCoord[0]][randomCoord[1]] instanceof PathCell) &&
                                    calcPythagDistance(randomCoord, centerCoord) > 5 && calcPythagDistance(randomCoord, centerCoord) < 10){

                                        //Check distance between towers. Needs to be > 10.
                                        let towerCheck = true;
                                        for(let k = 0; k < this.towerArray.length; k++){
                                            if(calcPythagDistance(randomCoord, [this.towerArray[k].mapX, this.towerArray[k].mapY]) < 10){
                                                towerCheck = false;
                                            }
                                        }
                                        if(towerCheck == true){
                                            this.mapArray[randomCoord[0]][randomCoord[1]] = new TowerCell(randomCoord[0], randomCoord[1], this);
                                            this.towerArray.push(this.mapArray[randomCoord[0]][randomCoord[1]]);
    
                                            pathFound = true;
                                        }
                                    }
                                break;
                        }
                    }
                }
            }
        }
        return this.mapArray;
    }
    //This takes the completed map array and displays it in the DOM.
    pushMapToDOM() { //pass in generation vars
        //createLocations goes here.
        //createRoom();

        //push elements to HTML DOM
        //MUST CLEAR GAMESPACE.CHILDREN BEFORE CALLING.
        for (var i = 0; i < this.mapArray.length; i++) { //For each row:
            //row div
            let rowDiv = document.createElement("div");
            rowDiv.setAttribute("class", "mapRow");

            for (var j = 0; j < this.mapArray[0].length; j++) { //For each column:
                let para = document.createElement("p");
                let cellEntity = this.mapArray[j][i];

                //set ids (coordinates) and classes (type).
                para.setAttribute("id", `[${cellEntity.mapX}][${cellEntity.mapY}]`);
                para.setAttribute("class", "mapCell");

                //Switch all elements' symbols to the obscured symbol in fog.
                let textNode = document.createTextNode(".");

                //append child to each element
                para.appendChild(textNode);
                rowDiv.appendChild(para);
            }
            //append rowdiv to document
            document.getElementById("gamePage__gameSpace__map__canvas").appendChild(rowDiv);
        }

        //Commit new DOM elements to cell in mapArray!
        for (var i = 0; i < this.mapArray.length; i++) {
            for (var j = 0; j < this.mapArray[0].length; j++) {
                this.mapArray[i][j].addDomElement();
            }
        }
    }

    //Fog of War Functions:
    hideCells() {
        for (let i = 0; i < this.mapArray.length; i++) {
            for (let j = 0; j < this.mapArray[0].length; j++) {
                let cell = this.mapArray[i][j];
                cell.hideCell();
            }
        }
    }
    //Show cells in vision. This is the fog of war function.
    showCellsInVision(radius, x, y) {

        //find all the elements in radius range and set symbols to cell.symbol.
        for (var i = 0; i < this.mapArray.length; i++) {//each column:
            for (var j = 0; j < this.mapArray[0].length; j++) {
                //let tempDistance = calcPythagDistance([i, j], [coordSetCenter[0], coordSetCenter[1]]);
                let tempDistance = calcPythagDistance([i, j], [x, y]);

                if (tempDistance <= radius) {
                    try {
                        let cell = this.mapArray[i][j];

                        //Change the map symbol for the tile.
                        cell.showCell();

                    } catch (err) { }
                }
            }
        }
    }

    //Draw Functions.
    //Draw and clear player.
    showPlayer(player) {
        this.showCellsInVision(player.visionRange, player.mapX, player.mapY);

        var currentCell = this.mapArray[player.position[0]][player.position[1]];
        currentCell.domElement.innerHTML = player.canvasSymbol;
        currentCell.domElement.style.fontWeight = "900";
        currentCell.domElement.style.opacity = "1";
    }
    clearPlayer() {
        var previousCell = this.mapArray[player.position[0]][player.position[1]];
        previousCell.domElement.innerHTML = previousCell.symbol;
        //NOTE: this may change as more room types are added.
        if (previousCell instanceof PathCell) {
            previousCell.domElement.style.fontWeight = "400";
            previousCell.domElement.style.opacity = "0.5";
        }
    }
}
class InputHandler {
    constructor() {

    }
}

//==============================================================Global functions
function randInt(max) { //Random function, maximum inclusive.
    return Math.floor(Math.random() * (max + 1));
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function calcPythagDistance(coordSetOne, coordSetCenter) {
    var differenceX = (coordSetOne[0] - coordSetCenter[0]);
    var differenceY = (coordSetOne[1] - coordSetCenter[1]);

    var distanceFromCenter = Math.sqrt((differenceX) ** 2 + (differenceY) ** 2);
    return distanceFromCenter;
}
//Fades elements in.
async function fadeElement(operation, element, time) {
    if (operation == "in") {
        element.style.opacity = "0.0";
        element.style.transition = `opacity ${time}s`;
        flushCSS(element);
        element.style.opacity = "1.0";
    }
    if (operation == "out") {
        element.style.opacity = "1.0";
        element.style.transition = `opacity ${time}s`;
        flushCSS(element);
        element.style.opacity = "0.0";
    }
    await sleep(time * 1000);
    //return the transition to normal.
    element.style.transition = `opacity 0s`;
    flushCSS(element);
}

//==============================================================initializing functions
//Display position listeners.
function setHoverListener(mapArray) {
    for (var i = 0; i < mapArray.length; i++) {
        for (var j = 0; j < mapArray[0].length; j++) {
            let cell = mapArray[i][j];

            cell.domElement.addEventListener("mouseover", function () { //this updates the display according to cell id.
                let tempString = cell.cellID.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1); //get cell coords

                document.getElementById("gamePage__footer__position").innerHTML = tempString;
                if (cell.domElement.innerHTML != ".") {
                    document.getElementById("gamePage__footer__cellName").innerHTML = cell.name;
                } else {
                    document.getElementById("gamePage__footer__cellName").innerHTML = "";
                }
            })
        }
    }
}
//Initialize movement button listeners.
function initMvmtListener(game) {
    document.getElementById("gamePage__gameSpace__map__mapMvmtW").addEventListener("click", function () {
        game.playerMovementHandler("KeyW");
    });
    document.getElementById("gamePage__gameSpace__map__mapMvmtA").addEventListener("click", function () {
        game.playerMovementHandler("KeyA");
    });
    document.getElementById("gamePage__gameSpace__map__mapMvmtS").addEventListener("click", function () {
        game.playerMovementHandler("KeyS");
    });
    document.getElementById("gamePage__gameSpace__map__mapMvmtD").addEventListener("click", function () {
        game.playerMovementHandler("KeyD");
    });
}

//Output function
async function pushMainOutput(message) {
    var outputDiv = document.getElementById("gamePage__outputBar");
    let newOutput = document.createElement("p");
    let text = document.createTextNode(message);

    newOutput.appendChild(text);
    newOutput.setAttribute("class", "mainOutput");
    newOutput.style.opacity = "0.0";
    outputDiv.insertBefore(newOutput, outputDiv.firstChild);

    fadeElement("in", newOutput, 0.5);

    /*Previous output function.
    var outputBoxes = [document.getElementById("gamePage__outputBar__box1"),
    document.getElementById("gamePage__outputBar__box2"),
    document.getElementById("gamePage__outputBar__box3"),
    document.getElementById("gamePage__outputBar__box4"),
    document.getElementById("gamePage__outputBar__box5")]

    for (var i = outputBoxes.length - 1; i > -1; i--) {
        if (i > 0) {
            outputBoxes[i].innerHTML = outputBoxes[i - 1].innerHTML;
        }
        if (i == 0) {
            outputBoxes[i].innerHTML = message;
            fadeElement("in", outputBoxes[i], 1);
        }
    }*/
}

//Resize the Canvas to un-blurry itself.
//Credits to  https://medium.com/wdstack/fixing-html5-2d-canvas-blur-8ebe27db07da!
function initializeCanvas() {
    var canvas = document.getElementById("gamePage__gameSpace__encounter__canvas__gameCanvas");
    var dpi = window.devicePixelRatio;
    //create a style object that returns width and height
    let style = {
        height() {
            return +getComputedStyle(canvas).getPropertyValue('height').slice(0, -2);
        },
        width() {
            return +getComputedStyle(canvas).getPropertyValue('width').slice(0, -2);
        }
    }
    //set the correct attributes for a crystal clear image!
    canvas.setAttribute('width', style.width() * dpi);
    canvas.setAttribute('height', style.height() * dpi);
}

//Function to get height?? https://stackoverflow.com/questions/6937378/element-offsetheight-always-0
/*function getHeight(element)
{
    element.style.visibility = "hidden";
    document.body.appendChild(element);
    var height = element.offsetHeight + 0;
    document.body.removeChild(element);
    element.style.visibility = "visible";
    return height;
}*/

function flushCSS(element) { //flushes css to no transition.
    element.offsetHeight;
}

async function initializeGame() {
    const game = new Game();
    const map = new MapHandler(30, 30, 80, 10);

    //init player
    player = new Player(10, 5, "@");
    player.getInitialPosition(map.mapWidth, map.mapHeight);

    //create map for new room.
    map.mapArray = map.generateNewRoom(game);
    //Set up displays.
    document.getElementById("gamePage__header__windowDisplay").innerHTML = windowTitles[0];

    //Show map.
    map.showCellsInVision(player.visionRange, player.mapX, player.mapY);
    map.showPlayer(player);

    //Input handlers.
    //KEYBOARD input, handled in Game.
    document.addEventListener("keydown", (e) => {
        game.keyDownHandler(map, player, map, e);
    })

    //Add listeners to attack and movement buttons.
    //initAtkListener();
    //initMvmtListener(game);
    //Hover listener.
    setHoverListener(map.mapArray);

    //temporary tutorial panel.
    await sleep(1000);
    pushMainOutput("Press Z for help!");


    //COMBAT TESTING, begin encounter here.
    await sleep(1000);
    game.changeWindow(2);
}