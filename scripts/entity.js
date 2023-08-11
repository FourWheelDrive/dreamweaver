class Entity {
    constructor(health, game, canvasSymbol) {
        this.health = health;
        this.canvasSymbol = canvasSymbol;

        this.buff;
        this.debuff;

        this.inventory = [];

        this.mapX;  //get position with getInitialPosition();
        this.mapY;
        this.position;

        this.game = game; //<-- game object.
    }

    //INITIALIZE Functions
    //Map methods
    getInitialPosition() {
        if (this.constructor.name == "Player") {
            this.updatePosition(Math.ceil(this.game.mapHandler.mapWidth / 2), Math.ceil(this.game.mapHandler.mapHeight / 2)); //For Player only!
        }
        if (this.constructor.name == "Enemy") {
            //random location on #PathCell.
            var locationFound = false;

            do {
                let tempPos = [randInt(this.game.mapHandler.mapWidth - 1), randInt(this.game.mapHandler.mapHeight - 1)];
                let centerCoord = [Math.ceil(this.game.mapHandler.mapWidth / 2), Math.ceil(this.game.mapHandler.mapHeight / 2)];

                //spawn outside vision.
                if (calcPythagDistance(tempPos, centerCoord) > this.game.player.visionRange &&
                    this.game.mapHandler.mapArray[tempPos[0]][tempPos[1]] instanceof PathCell) {
                    this.updatePosition(tempPos[0], tempPos[1]);
                    locationFound = true;
                }
            } while (!locationFound)
        }
    }
    //UPDATE Functions
    changeHealth(difference) {
        this.health = this.health - difference;
        switch (this.constructor.name) {
            case "Player":
                document.getElementById("gamePage__gameSpace__combat__entityStats__playerStats__health").innerHTML = this.health;
                break;
            case "Enemy":
                document.getElementById("gamePage__gameSpace__combat__entityStats__enemyStats__health").innerHTML = this.health;
                break;
        }
    }
    //This needs to check if item already exists in inventory, and then add 1 to that quantity.
    addToInventory(item) {
        this.inventory.push(item);
    }
    updatePosition(mapX, mapY) {
        this.mapX = mapX;
        this.mapY = mapY;
        this.position = [mapX, mapY];
    }
    iterateInventoryCooldowns() {
        for (let i = 0; i < this.inventory.length; i++) {
            this.inventory[i].iterateCooldown();
        }
    }
}
class Player extends Entity {
    constructor(health, game) {
        super(health, game, "@");
        this.equipped = [null, null, null, null];        //four Encounter slots.

        this.inventory = [];           //Array of item objects.
        this.inventoryButtonData = []; //relates buttons to attacks.
        this.inventoryPointerPosition = 0;

        /*//Masquerade multipliers!
        this.masquerade = 0;
        //array index 0 for multipliers is base. Thus, masquerade = 0 is base.
        this.damageMulti = [1, 1, 1.5, 2, 2.5, 3] //math.floor and multiply base damage by these. Scales well for baseDMG 1-3.
        this.healthMulti = [10, 9, 8, 7, 6, 5];*/

        this.wishes = health;
        this.visionRange = 2;

        //set up header. Player uses Wishes as max health.
        document.getElementById("gamePage__footer__health").innerHTML = `Wishes: ${this.health}/${this.wishes}`;
        this.getInitialPosition();
    }
    //Inventory methods
    //Also needs to CHECK IF INVENTORY IS FULL! Check Discord for quantity stacking idea.
    addToInventory(newCard) {
        let alreadyHave = false;
        for (let i = 0; i < this.inventory.length; i++) {
            if (newCard.id == this.inventory[i].id) {
                this.inventory[i].quantity = this.inventory[i].quantity + 1;
                alreadyHave = true;
            }
        }
        if (!alreadyHave) {
            this.inventory.push(newCard);
        }
        this.game.updateInventoryDisplay();
    }
    //if quantity decreases to 0.
    removeFromInventory(card) {
        this.inventory.splice(this.inventory.indexOf(card), 1);
        this.game.updateInventoryDisplay();

        if (this.game.gameState == 2) {
            //initializeCombatCardSlots must go after unlockPlayerCards <-- clones cardOrder nodes.
            this.game.unlockPlayerCards();
            this.game.initializeCombatCardSlots();
            setCombatSlotHoverListener(this.game);
        }
    }
    //Wishes.
    updateWishes(addedDiff) {
        this.wishes = this.wishes + addedDiff;
        if (this.health > this.wishes) {
            this.health = this.wishes;
        }
        document.getElementById("gamePage__footer__health").innerHTML = `Wishes: ${this.health}/${this.wishes}`;
    }
}

class Enemy extends Entity {
    constructor(game, index) {
        super(null, game, null);

        this.inventory = [];
        this.index = index;

        this.name;
        //for dialogues, pass in arrays! We'll cycle through the array in the output.
        this.contactDialogue;
        this.defeatDialogue;

        this.initializeEnemy();
        this.getInitialPosition();
    }
    initializeEnemy() {
        //Add filler card, regardless of enemy.
        this.addToInventory(new Card(0, this, 1));

        switch (this.index) {
            case -1:
                this.name = "test enemy";
                this.health = 10;
                this.canvasSymbol = "!";

                this.contactDialogue = ["Heheheha! I am amogus"];
                this.defeatDialogue = ["o noes"];
                this.addToInventory(new Card(-1, this, 1));
                this.addToInventory(new Card(-2, this, 1));
                this.addToInventory(new Card(-3, this, 1));
                break;
        }
    }
    moveEnemy() {
        let mapHandler = this.game.mapHandler;
        mapHandler.clearEnemy(this);

        /*  [0, 0] [1, 0] [2, 0] 
            [0, 1] [1, 1] [2, 1]
            [0, 2] [1, 2] [2, 2]

                    [x, y-1]
            [x-1, y] [x, y] [x+1, y]
                    [x, y+1]
        */
        var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        var distances = [null, null, null, null];
        var position = [this.mapX, this.mapY];

        var playerPos = [this.game.player.mapX, this.game.player.mapY];

        //loop through 4 directions and check distances. Also check if PathCell.
        for (let i = 0; i < directions.length; i++) {
            let newPos = [position[0] + directions[i][0], position[1] + directions[i][1]];

            try { //catch outofbounds cells.
                //check if valid cell to move to.
                if (mapHandler.mapArray[newPos[0]][newPos[1]] instanceof WallCell == false) {
                    distances[i] = calcPythagDistance(newPos, playerPos);
                } else {
                    distances[i] = null;
                }
            } catch (e) { }
        }
        //Find smallest distance and move there.
        let lowestDistIndex = 0;
        //find first non-null index.
        while (distances[lowestDistIndex] == null) {
            lowestDistIndex = lowestDistIndex + 1;
        }
        //find smallest index.
        for (let j = 1; j < distances.length; j++) {
            if (distances[j] != null && distances[j] < distances[lowestDistIndex]) {
                lowestDistIndex = j;
            }
        }
        //Move to the smallest distance.
        var finalNewPos = [position[0] + directions[lowestDistIndex][0], position[1] + directions[lowestDistIndex][1]];
        this.updatePosition(finalNewPos[0], finalNewPos[1]);

        mapHandler.showEnemy(this);
    }

    //same as Player method.
    addToInventory(newCard) {
        let alreadyHave = false;
        for (let i = 0; i < this.inventory.length; i++) {
            if (newCard.id == this.inventory[i].id) {
                this.inventory[i].quantity = this.inventory[i].quantity + 1;
                alreadyHave = true;
            }
        }
        if (!alreadyHave) {
            this.inventory.push(newCard);
        }
        this.game.updateInventoryDisplay();
    }

    //also initializes the encounter screen.
    async placeCards(enemyCardPositions) {
        var enemyCards = enemyCardPositions.length;

        //Place random cards.
        //AMENDEMENT: Actually, go in inventory order. Makes the enemy more predictable, when you learn its moves.
        //needs to account for card order?
        let index = 0;
        //j begins at 1 because inventory[0] is a filler "Patience" card.
        for (let j = 1; j < this.inventory.length; j++) {
            //if played the number of cards.
            if (index == enemyCards) {
                break;
            }
            if (this.inventory[j].onCooldown == 0) {
                this.inventory[j].cardPlayed(enemyCardPositions[index], this.game);
                //enemyCardPositions[index] represents cardPosition.
                index = index + 1;
            }
        }
        //if ran out of cards, play filler card:
        if (index < enemyCards) {
            //Play filler card.
            for (let k = index; k < enemyCards; k++) {
                this.inventory[0].cardPlayed(enemyCardPositions[k], this.game);
            }
        }
    }
}