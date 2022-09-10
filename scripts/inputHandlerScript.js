async function keyDownHandler(mapArray, e) {
    //Window navigation keys.
    //NOTE: needs to be restricted depending on gamestate!
    if ((e.code == "ArrowLeft" || e.code == "ArrowRight") && !e.repeat) {
        if (e.code == "ArrowLeft") {
            document.getElementById("gamePage__header__left").click();
        }
        if (e.code == "ArrowRight") {
            document.getElementById("gamePage__header__right").click();
        }
    }
    //Player movment keys.
    //NOTE: needs to be restricted depending on gamestate!
    if (game.gameState == "movement" && (e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA")) {
        playerMovementHandler(e, mapArray, player, enemy);
    }
    //Encounter keys and keybinds.
    if (game.gameState == "encounter" && (e.code == "KeyU" || e.code == "KeyI" || e.code == "KeyJ" || e.code == "KeyK")) {
        switch (e.code) {
            case "KeyU":
                document.getElementById("gamePage__gameSpace__encounter__menu__button1").click();
                break;
            case "KeyI":
                document.getElementById("gamePage__gameSpace__encounter__menu__button2").click();
                break;
            case "KeyJ":
                document.getElementById("gamePage__gameSpace__encounter__menu__button3").click();
                break;
            case "KeyK":
                document.getElementById("gamePage__gameSpace__encounter__menu__button4").click();
                break;
        }
    }
    /*
    setTimeout(function () { player.atkOnCD = false; }, player.attacks[0].cooldown * 1000);
    procButtonCooldownTimer(buttonId, player.attacks[0].cooldown); //animation. 
    */
}

async function windowNavButtonHandler(e) {
    e = e || window.event; //different event handlers.
    var buttonId = e.currentTarget.id;

    switch (buttonId) {
        case "gamePage__header__left":
            currentWindowIndex = currentWindowIndex - 1;
            if (currentWindowIndex < 0) {
                currentWindowIndex = windowDirectory.length - 1;
            }
            break;
        case "gamePage__header__right":
            currentWindowIndex = currentWindowIndex + 1;
            if (currentWindowIndex > windowDirectory.length - 1) {
                currentWindowIndex = 0;
            }
            break;
    }

    //If the button pressed was to change window, then do this after iterating window index.
    //NOTE: Checks might be made here later for gameState if window switches are valid.
    if (buttonId == "gamePage__header__left" || buttonId == "gamePage__header__right") {
        var mapWindow = document.getElementById("gamePage__gameSpace__map");
        var fightWindow = document.getElementById("gamePage__gameSpace__encounter");
        var inventoryWindow = document.getElementById("gamePage__gameSpace__inventory");
        var shopWindow = document.getElementById("gamePage__gameSpace__shop");
        //first set all to display none, then display new one.
        //Set all opacity to 1. Will change depending on phase.
        mapWindow.style.display = "none";
        fightWindow.style.display = "none";
        inventoryWindow.style.display = "none";
        shopWindow.style.display = "none";

        mapWindow.style.opacity = "1";
        fightWindow.style.opacity = "1";
        inventoryWindow.style.opacity = "1";
        shopWindow.style.opacity = "1";

        //Show new window.
        switch (windowDirectory[currentWindowIndex]) {
            case "map":
                mapWindow.style.display = "flex";
                game.windowState = "map";
                if (game.gameState != "movement") { //only valid when moving.
                    mapWindow.style.opacity = "0.5";
                }
                break;
            case "encounter":
                fightWindow.style.display = "grid";
                game.windowState = "fight";
                if (game.gameState != "encounter") { //only valid when fighting.
                    fightWindow.style.opacity = "0.5";
                }
                break;
            case "inventory":
                inventoryWindow.style.display = "block";
                game.windowState = "inventory";
                break;
            case "shop":
                shopWindow.style.display = "block";
                game.windowState = "shop";
                if(game.gameState != "shop"){ //only valid when end of room.
                    shopWindow.style.opacity = "0.5";
                }
                break;
        }
    }
    //update title.
    document.getElementById("gamePage__header__windowDisplay").innerHTML = `test window name \"${windowDirectory[currentWindowIndex]}\"`;
    //update displays.
    if (currentWindowIndex - 1 < 0) {
        document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = `${windowDirectory[windowDirectory.length - 1]}`;
    } else {
        document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex - 1]}`;
    }
    if (currentWindowIndex + 1 > windowDirectory.length - 1) {
        document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = `${windowDirectory[0]}`;
    } else {
        document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex + 1]}`;
    }
}

async function playerMovementHandler(e, mapArray) {
    let boardRows = document.getElementById("gamePage__gameSpace__map").children;
    //very cool directions array! Append each element instead of having 4 switch statements.
    //[left] [right] [up] [down]
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]],
        newDirection;

    //Cells to update
    let rowCells = boardRows[(player.mapPosition[1])].children;
    let currentCell = rowCells[player.mapPosition[0]],
        nextCellPos;
    //Make an array [x][y] of position. .filter removes whitespace from split.
    let currentCellPos = currentCell.id.split(/[\[\]]/).filter(element => element.length >= 1);
    //deltapos depending on key pressed.
    switch (e.code) {
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
        clearPlayer(mapArray);
        player.mapPosition = [nextCellPos[0], nextCellPos[1]];
        showCellsInVision(5, player.mapPosition[0], player.mapPosition[1], mapArray);
        showPlayer();
    }
    //Check if the next cell is an encounter cell.
    if (newCellEntity instanceof MinorEncounterCell) {
        newCellEntity.firstVisit();
    }
}

async function playerAttackHandler(e) {
    //player must be viewing the battle. No attacks can be made from other screens.
    if (game.windowState == "fight") {
        var tempCooldown;
        //NOTE: baseCooldown needs masq multiplier.
        //based on the attack procced, do stuff.
        if (game.gameState == "encounter") {
            switch (e.target.id) {
                case "gamePage__gameSpace__encounter__menu__button1":
                case"gamePage__gameSpace__encounter__menu__button1__text":
                    player.attacks[0].attackProcced(player, enemy);
                    tempCooldown = player.attacks[0].baseCooldown;
                    break;
                case "gamePage__gameSpace__encounter__menu__button2":
                case "gamePage__gameSpace__encounter__menu__button2__text":
                    player.attacks[1].attackProcced(player, enemy);
                    tempCooldown = player.attacks[1].baseCooldown;
                    break;
                case "gamePage__gameSpace__encounter__menu__button3":
                case "gamePage__gameSpace__encounter__menu__button3__text":
                    player.attacks[2].attackProcced(player, enemy);
                    tempCooldown = player.attacks[2].baseCooldown;
                    break;
                case "gamePage__gameSpace__encounter__menu__button4":
                case "gamePage__gameSpace__encounter__menu__button4__text":
                    player.attacks[3].attackProcced(player, enemy);
                    tempCooldown = player.attacks[3].baseCooldown;
                    break;
            }
            attackButtonCooldownAnimation(e.currentTarget.id, tempCooldown);
        }
    }
}

//plays animation. Also disables button: cooldown
function attackButtonCooldownAnimation(buttonId, time) {
    let button = document.getElementById(buttonId);
    let timer = button.querySelector(".encounterButton__progress");

    if (!button.disabled && game.gameState == "encounter") {

        //Animation!
        timer.style.transition = "none"; //no animation.
        timer.style.width = "100%";
        flushCSS(timer);

        timer.style.transition = `width ${time}s linear` //animation again
        timer.style.width = "0%";
        flushCSS(timer);
    }
    //Cooldown the button while animation takes place.
    button.disabled = true;
    setTimeout(function () { button.disabled = false; }, time * 1000);
}
function flushCSS(element) { //flushes css to no transition.
    element.offsetHeight;
}