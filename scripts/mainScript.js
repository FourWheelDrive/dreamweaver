const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;
var player;
var enemy;
var mapArray; //this is global now. It was too hard to keep encapsulated. Required for player masquerade.
var mapWidth = 31, mapHeight = 31;

//inventory screen initialize.
//global inventory var.
function initializeInventoryWindow() {
    var menu = document.getElementById("gamePage__gameSpace__inventory__itemList");

    var section1Menu = document.getElementById("gamePage__gameSpace__inventory__itemList__section1");
    var section2Menu = document.getElementById("gamePage__gameSpace__inventory__itemList__section2");
    var section3Menu = document.getElementById("gamePage__gameSpace__inventory__itemList__section3");

    var buttons;
    //clear all inventory buttons.
    //NOTE: see if this can be done better. Pretty sure this is just... bad. How does this work?
    for (var j = 0; j < 3; j++) {
        switch (j) {
            case 0:
                buttons = section1Menu.getElementsByTagName('button');
                break;
            case 1:
                buttons = section2Menu.getElementsByTagName("button");
                break;
            case 2:
                buttons = section3Menu.getElementsByTagName("button");
                break;
        }
        //Make a static array. buttons is HTMLcollection, and changes as things are .remove()'d.
        let tempArray = Array.from(buttons);
        for (var k = 0; k < tempArray.length; k++) {
            tempArray[k].remove();
        }
    }
    player.inventoryPointerPosition = 0;

    //Add attacks from player.attacks[].
    //Add attacks from player.inventory[].
    //Add items from player.inventory[].
    for (var i = 0; i < player.inventory.length; i++) {
        var button = document.createElement("button");
        var type;
        //check if this is an attack. Depending on class, it will be appended to different sections.W
        switch (player.inventory[i].constructor.name) {
            case "Attack":
                //switch again: equipped and unequipped attacks.
                switch (player.inventory[i].equipped) {
                    case true:
                        type = "Equipped Attack";
                        button.innerHTML = player.inventory[i].name;
                        button.dataset.objectId = player.inventory[i].id;
                        break;
                    case false:
                        type = "Attack";
                        button.innerHTML = player.inventory[i].name;
                        button.dataset.objectId = player.inventory[i].id;
                        break;
                }
                break;
            case "Item":
                type = "Item";
                button.dataset.objectId = player.inventory[i].id;
                break;
        }
        button.setAttribute("class", `inventoryMenuButton`);

        /*
        button.addEventListener("click", e => {
            if(e.detail === 1){
                inventoryButtonClickHandler(e);
            } else if(e.detail === 2){
                inventoryDoubleClickHandler(e);
            }
        }); //for click stuff.
        */
        
        /*Extra cases for mobile.
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            button.addEventListener("click", e => {
                alert("got here at least.")
                inventoryButtonClickHandler(e, true);
            }); //for click stuff.
        }*/
            button.addEventListener("click", inventoryButtonClickHandler); //for click stuff.
        
        //append depending on type.
        if (type == "Equipped Attack") {
            section1Menu.appendChild(button);
        } else if (type == "Attack") {
            section2Menu.appendChild(button);
        } else if (type == "Item") {
            section3Menu.appendChild(button);
        }
    }
    //assign button ids and initialize inventory marker.
    assignInventoryButtons();
    moveInventoryMarker();
}
//change button ids to be in order.
//This function also appends to player.inventoryButtonData! In the right order this time.
function assignInventoryButtons() {
    let temp = 0;
    var section1 = document.getElementById("gamePage__gameSpace__inventory__itemList__section1").children;
    var section2 = document.getElementById("gamePage__gameSpace__inventory__itemList__section2").children;
    var section3 = document.getElementById("gamePage__gameSpace__inventory__itemList__section3").children;
    //reset buttonData.
    player.inventoryButtonData = [];

    //loop through each section to assign ids from top, IN ORDER.
    for (var i = 0; i < section1.length; i++) {
        if (section1[i].tagName == "BUTTON") {
            section1[i].setAttribute("id", `gamePage__gameSpace__inventory__itemList__Button${temp}`);
            //push correct index to buttonData.
            player.inventoryButtonData.push(player.getInventoryCounterpartIndex(section1[i].dataset.objectId));
            temp = temp + 1;
        }
    }
    for (var j = 0; j < section2.length; j++) {
        if (section2[j].tagName == "BUTTON") {
            section2[j].setAttribute("id", `gamePage__gameSpace__inventory__itemList__Button${temp}`);
            //push correct index to buttonData.
            player.inventoryButtonData.push(player.getInventoryCounterpartIndex(section2[j].dataset.objectId));
            temp = temp + 1;
        }
    }
    for (var k = 0; k < section3.length; k++) {
        if (section3[k].tagName == "BUTTON") {
            section3[k].setAttribute("id", `gamePage__gameSpace__inventory__itemList__Button${temp}`);
            //push correct index to buttonData.
            player.inventoryButtonData.push(player.getInventoryCounterpartIndex(section3[k].dataset.objectId));
            temp = temp + 1;
        }
    }
}

//Display position listeners.
function setHoverListener(mapArray) {
    var boardRows = document.getElementById("gamePage__gameSpace__map__canvas").children;

    for (var i = 0; i < boardRows.length; i++) { //for each row div:
        let rowCells = boardRows[i].children;
        for (var j = 0; j < rowCells.length; j++) { //for each column cell in a row:
            let cell = rowCells[j];
            cell.addEventListener("mouseover", function () { //this updates the display according to cell id.
                let tempString = cell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1); //get cell coords
                let position = tempString.toString().split(/[\[\]\,]/);
                let cellEntity = mapArray[position[0]][position[1]];

                document.getElementById("gamePage__footer__position").innerHTML = tempString;
                if (cell.innerHTML != ".") {
                    document.getElementById("gamePage__footer__cellName").innerHTML = cellEntity.name;
                } else {
                    document.getElementById("gamePage__footer__cellName").innerHTML = "";
                }
            })
        }
    }
}
//Initialize movement button listeners.
function initMvmtListener() {
    document.getElementById("gamePage__gameSpace__map__mapMvmtW").addEventListener("click", playerMovementHandler.bind(null, "KeyW"));
    document.getElementById("gamePage__gameSpace__map__mapMvmtA").addEventListener("click", playerMovementHandler.bind(null, "KeyA"));
    document.getElementById("gamePage__gameSpace__map__mapMvmtS").addEventListener("click", playerMovementHandler.bind(null, "KeyS"));
    document.getElementById("gamePage__gameSpace__map__mapMvmtD").addEventListener("click", playerMovementHandler.bind(null, "KeyD"));
}
function initAtkListener() {
    document.getElementById("gamePage__gameSpace__encounter__menu__button1").addEventListener("click", playerAttackHandler);
    document.getElementById("gamePage__gameSpace__encounter__menu__button2").addEventListener("click", playerAttackHandler);
    document.getElementById("gamePage__gameSpace__encounter__menu__button3").addEventListener("click", playerAttackHandler);
    document.getElementById("gamePage__gameSpace__encounter__menu__button4").addEventListener("click", playerAttackHandler);
}

//Draw and clear player.
function showPlayer() {
    var currentCell = document.getElementById(`[${player.mapPosition[0]}][${player.mapPosition[1]}]`);
    currentCell.innerHTML = player.canvasSymbol;
    currentCell.style.fontWeight = "900";
    currentCell.style.opacity = "1";
}
function clearPlayer(mapArray) {
    var previousCell = document.getElementById(`[${player.mapPosition[0]}][${player.mapPosition[1]}]`);
    var cellEntity = mapArray[player.mapPosition[0]][player.mapPosition[1]];
    previousCell.innerHTML = cellEntity.symbol;
    //NOTE: this may change as more room types are added.
    previousCell.style.opacity = "0.5";
    if (cellEntity instanceof PathCell) {
        previousCell.style.fontWeight = "400";
    }
}

//Output function
async function pushMainOutput(message) {
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
    }
}

async function initializeGame() {
    //create map for new room.
    var maxTunnels = 80, maxLength = 10;
    mapArray = generateNewRoom(game.currentRoom, mapWidth, mapHeight, maxTunnels, maxLength);

    //init player
    player = new Player(10, "@");
    enemy = null;

    //NOTE: when inventory is added, Attack class may need additional descriptor attributes.
    player.addToInventory(entityDatabase.generateAttackByName("Light Attack"));
    player.addToInventory(entityDatabase.generateAttackByName("Heavy Attack"));
    player.addToInventory(entityDatabase.generateAttackByName("Basic Parry"));
    player.addToInventory(entityDatabase.generateAttackByName("Test Heal"));
    player.addNewAttack(player.inventory[0], 0);

    player.getInitialPosition(mapWidth, mapHeight);
    showPlayer();

    //init cooldown modules.
    var cooldownHandler = new CooldownHandler();
    cooldownHandler.initCooldowns();

    //Input handler.
    document.addEventListener("keydown", keyDownHandler.bind(null, mapArray), false);
    //Add listeners to attack and movement buttons.
    initAtkListener();
    initMvmtListener();
    //Hover listener.
    setHoverListener(mapArray);

    //temporary tutorial panel.
    await sleep(1000);
    pushMainOutput("Press Z for help!")
}