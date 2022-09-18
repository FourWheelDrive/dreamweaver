const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;
var player;
var enemy;

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
                if (cell.innerHTML != ".") {
                    document.getElementById("gamePage__footer__cellName").innerHTML = cellEntity.name;
                } else {
                    document.getElementById("gamePage__footer__cellName").innerHTML = "";
                }
            })
        }
    }
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

//inventory screen initialize.
//global inventory var.
function initializeInventoryWindow() {
    var menu = document.getElementById("gamePage__gameSpace__inventory__itemList");

    var section1Menu = document.getElementById("gamePage__gameSpace__inventory__itemList__section1");
    var section2Menu = document.getElementById("gamePage__gameSpace__inventory__itemList__section2");
    var section3Menu = document.getElementById("gamePage__gameSpace__inventory__itemList__section3");

    var equipButton1 = document.getElementById("gamePage__gameSpace__inventory__equipMenu__button1");
    var equipButton2 = document.getElementById("gamePage__gameSpace__inventory__equipMenu__button2");
    var equipButton3 = document.getElementById("gamePage__gameSpace__inventory__equipMenu__button3");
    var equipButton4 = document.getElementById("gamePage__gameSpace__inventory__equipMenu__button4");

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
    //Clear player button data.
    player.inventoryButtonData = [];

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
                        button.setAttribute("id", `gamePage__gameSpace__inventory__itemList__Button${i}`);
                        break;
                    case false:
                        type = "Attack";
                        button.innerHTML = player.inventory[i].name;
                        button.setAttribute("id", `gamePage__gameSpace__inventory__itemList__Button${i}`);
                        break;
                }
                break;
            case "Item":
                type = "Item";
                button.setAttribute("id", `gamePage__gameSpace__inventory__itemList__Button${i}`);
                break;
        }
        button.setAttribute("class", `inventoryMenuButton`);

        //append depending on type.
        if (type == "Equipped Attack") {
            section1Menu.appendChild(button);
        } else if (type == "Attack") {
            section2Menu.appendChild(button);
        } else if (type == "Item") {
            section3Menu.appendChild(button);
        }

        //Append this button to data class and then to player.inventoryButtonDataArray.
        player.inventoryButtonData.push(i);
    }
}

async function initializeGame() {
    //create map for new room.
    var mapWidth = 31, mapHeight = 31;
    var maxTunnels = 80, maxLength = 10;
    var mapArray = generateNewRoom(game.currentRoom, mapWidth, mapHeight, maxTunnels, maxLength);

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
    //Add listeners to attack buttons.
    document.getElementById("gamePage__gameSpace__encounter__menu__button1").addEventListener("click", playerAttackHandler, false);
    document.getElementById("gamePage__gameSpace__encounter__menu__button2").addEventListener("click", playerAttackHandler, false);
    document.getElementById("gamePage__gameSpace__encounter__menu__button3").addEventListener("click", playerAttackHandler, false);
    document.getElementById("gamePage__gameSpace__encounter__menu__button4").addEventListener("click", playerAttackHandler, false);
    //Hover listener.
    setHoverListener(mapArray);
}