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
    //Inventory naviation keys.
    if (game.windowState == "inventory" && (e.code == "ArrowUp" || e.code == "ArrowDown")) {
        var previousPointerPosition = player.inventoryPointerPosition;
        var len = player.inventory.length;

        //Change pointer position. Then call moveInventoryMarker to update buttons.
        switch (e.code) {
            case "ArrowUp":
                player.inventoryPointerPosition = player.inventoryPointerPosition - 1;
                if (player.inventoryPointerPosition < 0) {
                    player.inventoryPointerPosition = len - 1;
                }
                break;
            case "ArrowDown":
                player.inventoryPointerPosition = player.inventoryPointerPosition + 1;
                if (player.inventoryPointerPosition > len - 1) {
                    player.inventoryPointerPosition = 0;
                }
                break;
        }
        moveInventoryMarker(previousPointerPosition);
    }
    //Player movment keys.
    //NOTE: needs to be restricted depending on gamestate!
    if (game.gameState == "movement" && (e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA")) {
        playerMovementHandler(e, mapArray, player, enemy);
    }
    //change loadout from inventory.
    if (game.gameState == "movement" && game.windowState == "inventory" && (e.code == "KeyU" || e.code == "KeyI" || e.code == "KeyJ" || e.code == "KeyK")) {
        changeLoadout(e);
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

    //update window indices.
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
                if (game.gameState != "encounter" && game.gameState != "tempTransition") { //only valid when fighting.
                    fightWindow.style.opacity = "0.5";
                }
                break;
            case "inventory":
                player.inventoryPointerPosition = 0;
                initializeInventoryWindow(); //update the inventory.

                //disable loadout switches during fights.
                if (game.gameState == "encounter" || game.gameState == "tempTransition"){
                    document.getElementById("gamePage__gameSpace__inventory__equipMenu").style.opacity = "0.5";
                } else {
                    document.getElementById("gamePage__gameSpace__inventory__equipMenu").style.opacity = "1.0";
                }

                inventoryWindow.style.display = "grid";
                game.windowState = "inventory";
                break;
            case "shop":
                shopWindow.style.display = "grid";
                game.windowState = "shop";
                if (game.gameState != "shop") { //only valid when end of room.
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

//Movement and Attack keys. =================================================================================================||
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
                case "gamePage__gameSpace__encounter__menu__button1__text":
                    if (player.attacks[0] != null) {
                        player.attacks[0].attackProcced(player, enemy);
                        tempCooldown = player.attacks[0].baseCooldown;
                    }
                    break;
                case "gamePage__gameSpace__encounter__menu__button2":
                case "gamePage__gameSpace__encounter__menu__button2__text":
                    if (player.attacks[1] != null) {
                        player.attacks[1].attackProcced(player, enemy);
                        tempCooldown = player.attacks[1].baseCooldown;
                    }
                    break;
                case "gamePage__gameSpace__encounter__menu__button3":
                case "gamePage__gameSpace__encounter__menu__button3__text":
                    if (player.attacks[2] != null) {
                        player.attacks[2].attackProcced(player, enemy);
                        tempCooldown = player.attacks[2].baseCooldown;
                    }
                    break;
                case "gamePage__gameSpace__encounter__menu__button4":
                case "gamePage__gameSpace__encounter__menu__button4__text":
                    if (player.attacks[3] != null) {
                        player.attacks[3].attackProcced(player, enemy);
                        tempCooldown = player.attacks[3].baseCooldown;
                    }
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

//Inventory updates and actions. ============================================================================================||
//handles clicks instead of arrow keys. calls moveInventoryMarker().
function inventoryButtonClickHandler(e){
    let temp = player.inventoryPointerPosition;
    player.inventoryPointerPosition = e.target.id.slice(-1);
    moveInventoryMarker(temp);
}
//when player moves pointer, update display, scroll, and update stat panel.
function moveInventoryMarker(previousPointerPosition = null) {
    let display = document.getElementById("gamePage__gameSpace__inventory__itemList");
    //------if previousPointer exists, then remove marker from last position.------
    if (previousPointerPosition != null) {
        let oldButton = document.getElementById(`gamePage__gameSpace__inventory__itemList__Button${previousPointerPosition}`);
        oldButton.innerHTML = oldButton.innerHTML.slice(5, -5); //splice 5, -5 because > and < have esc chars.
    }
    //------update new button with marker ><------
    let newButton = document.getElementById(`gamePage__gameSpace__inventory__itemList__Button${player.inventoryPointerPosition}`);
    
    newButton.innerHTML = `> ${newButton.innerHTML} <`;

    //------automatically scrolls!------
    if (player.inventoryPointerPosition == 0) {
        document.getElementById("gamePage__gameSpace__inventory__itemList__section1__marker").scrollIntoView({ behaviour: "smooth", block: "nearest" });
        //display.scrollTop = 0;
    } else if (player.inventoryPointerPosition == player.inventory.length - 1) {
        document.getElementById("gamePage__gameSpace__inventory__itemList__bottomMarker").scrollIntoView({ behaviour: "smooth", block: "nearest" });
        //display.scrollTop = display.scrollHeight;
    } else {
        newButton.scrollIntoView({ behaviour: "smooth", block: "nearest" });
    }
    //------Update attributes panel!------
    updateStatDisplay()
}
function updateStatDisplay() {
    //NOTE: this should probably apply modifiers instead of base values later.
    let invObj = player.inventory[player.inventoryPointerPosition];
    let type = invObj.constructor.name.toUpperCase();
    document.getElementById("gamePage__gameSpace__inventory__statDisplay__type").innerHTML = type;
    document.getElementById("gamePage__gameSpace__inventory__statDisplay__equipped").innerHTML = `Equipped: ${invObj.equipped}`;
    document.getElementById("gamePage__gameSpace__inventory__statDisplay__description").innerHTML = invObj.description;

    if (invObj.baseCooldown != null) {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__cooldown").innerHTML = `Cooldown: ${invObj.baseCooldown}`;
    } else {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__cooldown").innerHTML = `Cooldown: --`;
    }
    if (invObj.effect != "none") {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__effect").innerHTML = `Effect: ${invObj.effect} - [${invObj.baseEffectDuration}s]`;
    } else {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__effect").innerHTML = `Effect: --`;
    }
    if (invObj.baseChannelling != null) {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__channelling").innerHTML = `Channelling: ${invObj.baseChannelling}s`;
    } else {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__channelling").innerHTML = `Channelling: --`;
    }
    if (invObj.baseDamage != null) {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__damage").innerHTML = `Base Damage: ${invObj.baseDamage}`;
    } else {
        document.getElementById("gamePage__gameSpace__inventory__statDisplay__damage").innerHTML = `Base Damage: --`;
    }
}
//Depending on pointerPosition, switch out attacks and then update inventory display.
function changeLoadout(e) {
    let position;
    let attack = player.inventory[player.inventoryButtonData[player.inventoryPointerPosition]];
        switch(e.code){
            case "KeyU":
                position = 0;
                break;
            case "KeyI":
                position = 1;
                break;
            case "KeyJ":
                position = 2;
                break;
            case "KeyK":
                position = 3;
                break;
        }
    player.addNewAttack(attack, position);
    initializeInventoryWindow();
}

