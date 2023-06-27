class Entity {
    constructor(health, canvasSymbol, mapX, mapY) {
        this.health = health;
        this.canvasSymbol = canvasSymbol;

        this.buff;
        this.debuff;

        this.inventory = [];

        this.mapX = mapX;
        this.mapY = mapY;
        this.position;
    }

    //INITIALIZE Functions
    //Map methods
    getInitialPosition(mapWidth, mapHeight) {
        if(this.constructor.name == "Player"){
            this.updatePosition(Math.ceil(mapWidth / 2), Math.ceil(mapHeight / 2)); //For Player only!
        }
    }
    //UPDATE Functions
    changeHealth(difference){
        this.health = this.health - difference;
    }
    //This needs to check if item already exists in inventory, and then add 1 to that quantity.
    addToInventory(item){
        this.inventory.push(item);
    }
    updatePosition(mapX, mapY){
        this.mapX = mapX;
        this.mapY = mapY;
        this.position = [mapX, mapY];
    }
}
class Player extends Entity {
    constructor(health) {
        super(health, "@");
        this.equipped = [null, null, null, null];        //four Encounter slots.

        this.inventory = [];           //Array of item objects.
        this.inventoryButtonData = []; //relates buttons to attacks.
        this.inventoryPointerPosition = 0;

        /*//Masquerade multipliers!
        this.masquerade = 0;
        //array index 0 for multipliers is base. Thus, masquerade = 0 is base.
        this.damageMulti = [1, 1, 1.5, 2, 2.5, 3] //math.floor and multiply base damage by these. Scales well for baseDMG 1-3.
        this.healthMulti = [10, 9, 8, 7, 6, 5];*/

        this.wishes = 10;
        this.visionRange = 2;

        //set up header.
        document.getElementById("gamePage__footer__health").innerHTML = `Health: ${this.health}`;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
    }
    //Inventory methods
    addToInventory(newObject) {
        this.inventory.push(newObject);
    }
    //Loadout switch from inventory
    addNewAttack(newAttack, position) {
        //NOTE: needs new case for 4+ attacks to go to replace.
        //NOTE: this should also be paired with a selection for which button to replace. Might come with inventory system.

        //NOTE: IF THE ATTACK IS ALREADY EQUIPPED, CHANGE LAST POSITION (this.attacks) TO NULL.
        //if the attack is equipped, remove it.
        if (newAttack.equipped) {
            for (var i = 0; i < player.attacks.length; i++) {
                try {
                    if (player.attacks[i].id == newAttack.id) {
                        player.attacks[i] = null;
                    }
                } catch (e) { }
            }
        }
        //unequip last attack.
        let previousAttack = this.attacks[position];
        if (previousAttack != null) {
            previousAttack.equipped = false;
        }
        this.attacks[position] = newAttack;
        newAttack.equipped = true;

        //Update the button displays-- both for encounters and for inventory!
        for (var i = 0; i < this.attacks.length; i++) {
            if (this.attacks[i] == null) {
                document.getElementById(`gamePage__gameSpace__encounter__menu__button${i + 1}__text`).textContent = "";
                document.getElementById(`gamePage__gameSpace__inventory__equipMenu__button${i + 1}`).innerHTML = "";
            } else {
                document.getElementById(`gamePage__gameSpace__encounter__menu__button${i + 1}__text`).textContent = `${this.attacks[i].name}`;
                document.getElementById(`gamePage__gameSpace__inventory__equipMenu__button${i + 1}`).innerHTML = `${this.attacks[i].name}`;
            }
        }
        //update inventory display.
        initializeInventoryWindow();
    }
    getInventoryCounterpartIndex(id) {
        for (var i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].id == id) {
                return i;
            }
        }
    }
    
    //Get Cell entity from position.
    getCurrentCellEntity() {
        return mapArray[this.mapPosition[0]][this.mapPosition[1]];
    }
    //Wishes.
    updateWishes(difference) {
        this.wishes = this.wishes + difference;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack, name, contactDialogue = [], defeatDialogue = []) {
        super(health, canvasSymbol);
        this.attack = attack;
        this.attackInterval;

        this.name = name;
        //for dialogues, pass in arrays! We'll cycle through the array in the output.
        this.contactDialogue = contactDialogue;
        this.defeatDialogue = defeatDialogue;
    }

    //also initializes the encounter screen.
    async beginAttackSequence(cooldownHandler) {
        //attack, then set timer.
        this.attack.attackProcced(enemy, player, cooldownHandler);

        //attack timer.
        this.attackInterval = setInterval(async () => {
            if (gameManager.gameState == "encounter") {
                this.attack.attackProcced(enemy, player, cooldownHandler);
            }
        }, this.attack.baseCooldown * 1000);
    }
}