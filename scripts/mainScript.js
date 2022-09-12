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
function initializeInventoryWindow() {
    var menu = document.getElementById("gamePage__gameSpace__inventory__itemList");
    //First, clear the menu of everything.
    /*while(menu.firstChild){
        menu.removeChild(menu.lastChild);
    }*/

    let marker1 = document.getElementById("gamePage__gameSpace__inventory__itemList__marker1");
    let marker2 = document.getElementById("gamePage__gameSpace__inventory__itemList__marker2");
    let marker3 = document.getElementById("gamePage__gameSpace__inventory__itemList__marker3");
    //Add attacks from player.attacks[].
    for (var i = 0; i < player.attacks.length; i++) {
        var button = document.createElement("button");
        //add button element for each non-null attack.
        if (player.attacks[i] != null) {
            if (i == 0) {
                button.innerHTML = `> ${player.attacks[i].name} <`;
            } else {
                button.innerHTML = player.attacks[i].name;
            }
            button.setAttribute("id", `gamePage__gameSpace__inventory__itemList__section1Button-${i}`);
            button.setAttribute("class", `inventoryMenuButton`);
            menu.insertBefore(button, marker2);
        }
    }
    //Add attacks from player.inventory[].
    //Add items from player.inventory[].
    for (var i = 0; i < player.inventory.length; i++) {
        var button = document.createElement("button");
        var type;
        //check if this is an attack. Depending on class, it will be appended to different sections.
        switch (player.inventory[i].constructor.name) {
            case "Attack":
                type = "Attack";
                button.innerHTML = player.inventory[i].name;
                button.setAttribute("id", `gamePage__gameSpace__inventory__itemList__section2Button-${i}`);
                break;
            case "Item":
                type = "Item";
                button.setAttribute("id", `gamePage__gameSpace__inventory__itemList__section3Button-${i}`);
                break;
        }
        button.setAttribute("class", `inventoryMenuButton`);

        //append depending on type.
        if (type == "Attack") {
            menu.insertBefore(button, marker3);
        } else if (type == "Item") {
            menu.appendchild(button);
        }
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
    player.addNewAttack(new Attack("Test Attack", 1, 2, 0), 0);
    player.addNewAttack(new Attack("Test Parry", 0, 2, 0, "parry", 1), 1);
    //player.addNewAttack(new Attack("Test H. Attack", 2, 4, 2), 2);
    //player.addNewAttack(new Attack("Test Heal", -1, 3, 1, "heal", 0), 3);

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

    //player.addToInventory(new Attack("Test H. Attack", 2, 4, 2));
    //player.addToInventory(new Attack("Test H. Attack", 2, 4, 2));
    //player.addToInventory(new Attack("Test H. Attack", 2, 4, 2));
    //player.addToInventory(new Attack("Test H. Attack", 2, 4, 2));
    //player.addToInventory(new Attack("Test Heal", -1, 3, 1, "heal", 0));
    initializeInventoryWindow();
}

/*List of attack templates.
new Attack("basic attack", 1, 2, 0);
new Attack("parry", 0, 0, 0, "parry", 3);
new Attack("heavy attack", 3, 4, 1);
*/