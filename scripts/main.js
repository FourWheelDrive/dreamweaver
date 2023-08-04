class Game {
    constructor() {
        this.gameState = 1;
        this.windowState = 1;
        this.windowTitles = ["test dialogue", "THE DREAM", "THE WAR ROOM", "THE WISHING WELL"];
        /*
        0 - dialogue, win/end pages ||| disable movement keys, attack keys
        1 - movement                ||| disable                attack keys
        2 - encounter               ||| disable movement keys            
        3 - shop                    ||| disable movement keys, attack keys
        */
        this.player;

        this.currentRoom = 1;
        this.enemies = [];     //Array of enemy entities. Will be moved towards the player if within certain radius in turnHandler.
        this.currentEnemy;     //Index of current enemy.

        this.combatCardSlots = [
            document.getElementById("gamePage__gameSpace__combat__cardOrder__0"),
            document.getElementById("gamePage__gameSpace__combat__cardOrder__1"),
            document.getElementById("gamePage__gameSpace__combat__cardOrder__2"),
            document.getElementById("gamePage__gameSpace__combat__cardOrder__3"),
            document.getElementById("gamePage__gameSpace__combat__cardOrder__4")
        ];
        this.playerCardPositions = [];
        this.enemyCardPositions = [];
        this.filledCardPositions = [];

        this.cardQueue = [null, null, null, null, null]; //combat turn cards.
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
    async turnHandler(map, e) {
        map.hideCells();

        //Show Tower vision.
        for (let i = 0; i < map.towerArray.length; i++) {
            if (map.towerArray[i].active) {
                map.towerArray[i].showTowerVision();
            }
        }

        var movementCode;
        //Check input type!
        //Mouse input
        if (e.type == "click") {
            switch (e.target.id) {
                case "gamePage__gameSpace__map__mapMvmtW":
                    movementCode = "KeyW";
                    break;
                case "gamePage__gameSpace__map__mapMvmtA":
                    movementCode = "KeyA";
                    break;
                case "gamePage__gameSpace__map__mapMvmtS":
                    movementCode = "KeyS";
                    break;
                case "gamePage__gameSpace__map__mapMvmtD":
                    movementCode = "KeyD";
                    break;
            }
        } else {
            //Keyboard input
            movementCode = e.code;
        }
        this.playerMovementHandler(map.mapArray, map, movementCode);
        //^ handles moving the player and showing the player!
    }

    //Inventory initializations and updates.
    //when card icons happen, this needs to be updated.
    updateInventoryDisplay() {
        //Step 1: Clear all current child elements.
        var inventoryDiv = document.getElementById("gamePage__gameSpace__combat__inventoryDisplay");
        //Super https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript to the rescue!
        inventoryDiv.replaceChildren();

        //Step 2: Find player inventory and add.
        for (let i = 0; i < this.player.inventory.length; i++) {
            let newCard = document.createElement("div");
            let newIcon; //when i sort out card icons.
            let newName = document.createElement("p");

            newName.innerText = `${this.player.inventory[i].name}`;

            newCard.setAttribute("id", `gamePage__gameSpace__combat__inventoryDisplay__${i}`);
            newCard.setAttribute("class", "inventoryCard");
            newName.setAttribute("id", `gamePage__gameSpace__combat__inventoryDisplay__${i}__name`);

            //newCard.appendChild(newIcon);
            newCard.appendChild(newName);
            inventoryDiv.appendChild(newCard);

            //Update the card's DOM Element.
            this.player.inventory[i].domElement = document.getElementById(`gamePage__gameSpace__combat__inventoryDisplay__${i}`);
        }
        //reset hover listener to show cards in full display.
        setCardHoverListener(this.player);
    }

    //Combat Functions:

    //Sets flags and changes gamestates for combat.
    startCombat(inTowerRange, currentEnemyIndex) {
        //1) change gameState flags
        this.gameState = 2;
        this.changeWindow(2);
        this.currentEnemy = this.enemies[currentEnemyIndex];

        this.startCombatTurn(inTowerRange);
    }
    //Sets flags and ends combat.
    endCombat() {

    }

    //Clears queue and sets up each card turn.
    startCombatTurn(inTowerRange) {
        //2) make sure keyHandlers handle flags
        //done.
        //clear cardq
        this.cardQueue = [null, null, null, null, null];
        this.filledCardPositions = [];
        //3) update displays.
        document.getElementById("gamePage__gameSpace__combat__entityStats__playerStats__health").innerHTML = `${this.player.health}`;
        document.getElementById("gamePage__gameSpace__combat__entityStats__enemyStats__health").innerHTML = `${this.currentEnemy.health}`

        //start turn.
        //Find card positions
        this.generateCardSlots(inTowerRange);
        //Enemy places cards.
        this.currentEnemy.placeCards(this.enemyCardPositions);
        //Unlock player cards. Player places cards.
        this.unlockPlayerCards();
        this.initializeCombatCardSlots();

        console.log(this.cardQueue)
    }
    //Evaluates card queue. Evaluates win conditions.
    endCombatTurn() {
        console.log("ended turn")
        //===================================================
        //Freeze combat flags.
        //draggable = false. Evaluate damage.
        for (let i = 0; i < this.player.inventory.length; i++) {
            this.player.inventory[i].domElement.setAttribute("draggable", "false");
        }
        //===================================================
        //evaluate cards.
        for (let j = 0; j < this.cardQueue.length; j++) {
            this.cardQueue[j].cardEvaluated(j);
        }
    }

    generateCardSlots(inTowerRange) {
        //reset card slots.
        this.playerCardPositions = [];
        this.enemyCardPositions = [];
        //===================================================
        //3) Choose card slots.
        //if(player priority): /else
        let playerCardTotal;
        if (inTowerRange) {
            playerCardTotal = 3;
        } else { playerCardTotal = 2; }
        //4) Choose Player card slots, including modifiers.
        //5) Choose Enemy card slots.
        //get player card pos
        while (this.playerCardPositions.length < playerCardTotal) {
            //random number from 0 - 4, 5 exclusive.
            let n = Math.floor(Math.random() * 5)
            //Thank you to https://stackoverflow.com/questions/2380019/generate-unique-random-numbers-between-1-and-100 !
            if (this.playerCardPositions.indexOf(n) === -1) { //if index not found, push n to card positions.
                this.playerCardPositions.push(n);
            }
        }
        //get enemy card pos
        for (let k = 0; k < 5; k++) {
            let v = k;
            if (this.playerCardPositions.indexOf(v) === -1) {
                this.enemyCardPositions.push(v);
            }
        }
    }

    unlockPlayerCards() {
        //===================================================
        //3) Unlock inventory cards for combat.
        for (let i = 0; i < this.player.inventory.length; i++) {
            //make cards draggable if onCooldown is off.
            if (this.player.inventory[i].onCooldown == 0) {
                this.player.inventory[i].domElement.setAttribute("draggable", "true");
                //set functions for drop.
                //Defines data to send with drag.
                this.player.inventory[i].domElement.addEventListener("dragstart", (e) => {

                    //send ("text", i) instead? We can use player.inventory[i] on the other side to trigger card response.
                    e.dataTransfer.setData("text", i);
                    for (let m = 0; m < this.playerCardPositions.length; m++) {
                    }
                })
            } else {
                this.player.inventory[i].domElement.style.opacity = 0.5;
            }
        }
        //Clear and re-add drag-drop event listeners.
        for (let n = 0; n < this.combatCardSlots.length; n++) {
            this.combatCardSlots[n] = document.getElementById(`gamePage__gameSpace__combat__cardOrder__${n}`).cloneNode(true);
        }
        document.getElementById("gamePage__gameSpace__combat__cardOrder").replaceChildren();
        for (let l = 0; l < this.combatCardSlots.length; l++) {
            document.getElementById("gamePage__gameSpace__combat__cardOrder").appendChild(this.combatCardSlots[l]);
        }
        //===================================================
        //if all card slots filled, end turn. HOW DO I DETECT THIS, WTH? Check if thing onDrop worked.
        //Add a check at the end of each ondrop listener to check if queue is filled??
    }
    //Handles drag/drop data.
    //initializeCombatCardSlots must go after unlockPlayerCards <-- clones cardOrder nodes.
    initializeCombatCardSlots() {
        //Make player card slots light up.
        //reset card slots.
        for (let z = 0; z < 5; z++) {
            document.getElementById(`gamePage__gameSpace__combat__cardOrder__${z}`).style.border = "1px solid black";
        }

        for (let y = 0; y < this.playerCardPositions.length; y++) {
            document.getElementById(`gamePage__gameSpace__combat__cardOrder__${this.playerCardPositions[y]}`).style.border = "2px solid black";
        }

        //4) Initialize event listeners for card slots.
        for (let m = 0; m < this.playerCardPositions.length; m++) {
            //only drop on unfilled slots.
            if (this.filledCardPositions.indexOf(this.playerCardPositions[m]) === -1) {
                this.combatCardSlots[this.playerCardPositions[m]].addEventListener("dragover", (e) => {
                    e.preventDefault();
                })
                this.combatCardSlots[this.playerCardPositions[m]].addEventListener("drop", (e) => {
                    e.preventDefault();

                    var data = e.dataTransfer.getData("text");
                    this.player.inventory[data].cardPlayed(this.playerCardPositions[m], this);
                    //Transfer inventory data instead. Use card.cardPlayed() to move things into new div on drop.
                    //e.target.appendChild(document.getElementById(data));

                    //Sweep check for if this was the last card in queue.
                    if (this.cardQueue.indexOf(null) === -1) {
                        this.endCombatTurn();
                    }
                })
            }
        }
    }

    //Key handlers:
    async changeWindow(newWindowState) {
        this.windowState = newWindowState;
        switch (this.windowState) {
            case 0:
                break;
            case 1:
                document.getElementById("gamePage__gameSpace__map").style.display = "grid";
                document.getElementById("gamePage__gameSpace__combat").style.display = "none";
                document.getElementById("gamePage__gameSpace__shop").style.display = "none";

                document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = "shop";
                document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = "inventory";
                break;
            case 2:
                document.getElementById("gamePage__gameSpace__map").style.display = "none";
                document.getElementById("gamePage__gameSpace__combat").style.display = "grid";
                document.getElementById("gamePage__gameSpace__shop").style.display = "none";

                document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = "map";
                document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = "shop";

                //also remember to init inventory.
                this.updateInventoryDisplay(this.player);
                break;
            case 3:
                document.getElementById("gamePage__gameSpace__map").style.display = "none";
                document.getElementById("gamePage__gameSpace__combat").style.display = "none";
                document.getElementById("gamePage__gameSpace__shop").style.display = "grid";

                document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = "inventory";
                document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = "map";
                break;
        }
        document.getElementById("gamePage__header__windowDisplay").innerHTML = this.windowTitles[this.windowState];
    }
    async playerMovementHandler(mapArray, mapHandler, key) {
        //very cool directions array! Append each element instead of having 4 switch statements.
        //[left] [right] [up] [down]
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]],
            newDirection;

        //Cells to update
        let currentCell = mapArray[this.player.position[0]][this.player.position[1]],
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
            mapHandler.clearPlayer(this.player);
            this.player.updatePosition(nextCellPos[0], nextCellPos[1]);


            //Proc encounters!!!
            /*if (newCellEntity) {
                newCellEntity.visit();
            }*/
        }
        //Show the player.
        mapHandler.showPlayer(this.player);
    }
    //THIS FUNCTION WILL LATER BE CHECKING FOR GAMESTATE.
    async keyDownHandler(e, map = null) {
        //Keyboard handlers from document listeners.
        if (e.type == "keydown") {
            //movement keys
            //state check
            if (this.gameState == 1 && this.windowState == 1) {
                if (e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA") {
                    this.turnHandler(map, e);
                }
            }

            //window navigation keys
            if (this.gameState == 1) {
                if (e.code == "ArrowRight" || e.code == "ArrowLeft") {
                    switch (e.code) {
                        case "ArrowRight":
                            this.windowState = this.windowState + 1;
                            if (this.windowState > 3) {
                                this.windowState = 1;
                            }
                            this.changeWindow(this.windowState);
                            break;
                        case "ArrowLeft":
                            this.windowState = this.windowState - 1;
                            if (this.windowState < 1) {
                                this.windowState = 3;
                            }
                            this.changeWindow(this.windowState);
                            break;
                    }
                }
            }
        }
        //Mouse handlers from button listeners. (More complete)
        if (e.type == "click") {
            //Movement keys.
            //state check
            if (this.gameState == 1 && this.windowState == 1) {
                if (e.target.id == "gamePage__gameSpace__map__mapMvmtW" ||
                    e.target.id == "gamePage__gameSpace__map__mapMvmtA" ||
                    e.target.id == "gamePage__gameSpace__map__mapMvmtS" ||
                    e.target.id == "gamePage__gameSpace__map__mapMvmtD") {
                    this.turnHandler(map, e);
                }
            }

            //window navigation keys
            if (this.gameState == 1) {
                if (e.target.id == "gamePage__header__left" || e.target.id == "gamePage__header__right" ||
                    e.target.id == "gamePage__header__leftWindowDisplay" || e.target.id == "gamePage__header__rightWindowDisplay") {
                    switch (e.target.id) {
                        case "gamePage__header__right":
                        case "gamePage__header__rightWindowDisplay":
                            this.windowState = this.windowState + 1;
                            if (this.windowState > 3) {
                                this.windowState = 1;
                            }
                            this.changeWindow(this.windowState);
                            break;
                        case "gamePage__header__left":
                        case "gamePage__header__leftWindowDisplay":
                            this.windowState = this.windowState - 1;
                            if (this.windowState < 1) {
                                this.windowState = 3;
                            }
                            this.changeWindow(this.windowState);
                            break;
                    }
                }
            }
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
        console.log("M1: Array complete.")
        //generate random paths procedurally
        this.mapArray = this.createMapPaths();
        console.log("M2: Paths complete.")

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
            console.log(`M3: Tower ${i} complete.`)
        }
        for (var j = 0; j < this.towerArray.length; j++) {
            this.towerArray[j].activateTower();
        }
        console.log("M3: Towers complete.")

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
        let centerCoord = [Math.ceil(this.mapWidth / 2), Math.ceil(this.mapHeight / 2)];

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

                        console.log("PathFound!") //<== this got infinite looped. Why?
                        console.log(`x: ${x} y:${y}`)
                        //This is the actual test part. Scalability comes from here!
                        switch (type) {
                            case "Tower":
                                if ((this.mapArray[randomCoord[0]][randomCoord[1]] instanceof WallCell || this.mapArray[randomCoord[0]][randomCoord[1]] instanceof PathCell) &&
                                    calcPythagDistance(randomCoord, centerCoord) > 5 && calcPythagDistance(randomCoord, centerCoord) < 10) {

                                    //Check distance between towers. Needs to be > 10.
                                    let towerCheck = true;
                                    for (let k = 0; k < this.towerArray.length; k++) {
                                        if (calcPythagDistance(randomCoord, [this.towerArray[k].mapX, this.towerArray[k].mapY]) < 10) {
                                            console.log("TowerCheckFailed!")
                                            towerCheck = false;
                                        }
                                    }
                                    if (towerCheck == true) {
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
    clearPlayer(player) {
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
//Display hover listeners.
function setMapHoverListener(mapArray) {
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
//Show expanded inventory card in display.
//UPDATE when EFFECTS (buffs/debuffs) are added. Also when ICONS are added.
function setCardHoverListener(player) {
    for (let i = 0; i < player.inventory.length; i++) {
        player.inventory[i].domElement.addEventListener("mouseover", function () {
            document.getElementById("gamePage__gameSpace__combat__fullDisplays__fullCardDisplay__name").innerHTML = player.inventory[i].name;
            document.getElementById("gamePage__gameSpace__combat__fullDisplays__fullCardDisplay__magnitude-type").innerHTML = `${player.inventory[i].type}-${player.inventory[i].magnitude}`;
            document.getElementById("gamePage__gameSpace__combat__fullDisplays__fullCardDisplay__lore").innerHTML = player.inventory[i].lore;
            document.getElementById("gamePage__gameSpace__combat__fullDisplays__fullCardDisplay__description").innerHTML = player.inventory[i].description;

            //effect updaters. Uncomment when effects implemented.
            //document.getElementById("gamePage__gameSpace__combat__fullDisplays__fullEffectDisplay__name").innerHTML = player.inventory[i].effect.name;
            //document.getElementById("gamePage__gameSpace__combat__fullDisplays__fullEffectDisplay__description").innerHTML = player.inventory[i].effect.description;
        })
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
    game.player = new Player(10, game);
    game.player.getInitialPosition(map.mapWidth, map.mapHeight);

    //create map for new room.
    map.mapArray = map.generateNewRoom(game);
    //Set up displays.
    document.getElementById("gamePage__header__windowDisplay").innerHTML = game.windowTitles[1];

    //Show map.
    map.showCellsInVision(game.player.visionRange, game.player.mapX, game.player.mapY);
    map.showPlayer(game.player);

    //Input handlers.
    //KEYBOARD input, handled in Game.
    document.addEventListener("keydown", (e) => {
        game.keyDownHandler(e, map);
    })
    //MOUSE input, also handled in Game.
    var mapMouseButtons = document.getElementsByClassName("mapMvmtButton");
    for (var i = 0; i < mapMouseButtons.length; i++) {
        mapMouseButtons[i].addEventListener("click", (e) => {
            game.keyDownHandler(e, map);
        })
    }
    var windowNavButtons = document.getElementsByClassName("windowNavButtons");
    for (var j = 0; j < windowNavButtons.length; j++) {
        windowNavButtons[j].addEventListener("click", (e) => {
            game.keyDownHandler(e, map);
        })
    }

    //Add listeners to attack and movement buttons.
    //initAtkListener();
    //initMvmtListener(game);
    //Hover listener.
    setMapHoverListener(map.mapArray);

    //temporary tutorial panel.
    await sleep(1000);
    pushMainOutput("Press Z for help!");

    //INVENTORY TESTING
    game.player.addToInventory(new Card(-1, game.player, 3));
    game.player.addToInventory(new Card(-2, game.player, 1));
    game.player.addToInventory(new Card(-3, game.player, 1));
    //COMBAT TESTING, begin encounter here.
    await sleep(1000);

    game.enemies.push(new Enemy(10, game, "!", -1));
    game.startCombat(true, 0);
}