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
    constructor(health, game) {
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

        this.wishes = health;
        this.visionRange = 2;

        this.game = game; //the game object. Has helpful methods.

        //set up header. Player uses Wishes as max health.
        document.getElementById("gamePage__footer__health").innerHTML = `Wishes: ${this.health}/${this.wishes}`;
        //document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
    }
    //Inventory methods
    //Also needs to CHECK IF INVENTORY IS FULL! Check Discord for quantity stacking idea.
    addToInventory(newCard) {
        let alreadyHave = false;
        for(let i = 0; i < this.inventory.length; i++){
            if(newCard.id == this.inventory[i].id){
                this.inventory[i].quantity = this.inventory[i].quantity + 1;
                alreadyHave = true;
            }
        }
        if(!alreadyHave){
            this.inventory.push(newCard);
        }
        this.game.updateInventoryDisplay();
    }
    //Wishes.
    updateWishes(addedDiff) {
        this.wishes = this.wishes + addedDiff;
        if(this.health > this.wishes){
            this.health = this.wishes;
        }
        document.getElementById("gamePage__footer__health").innerHTML = `Wishes: ${this.health}/${this.wishes}`;
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack, name, contactDialogue = [], defeatDialogue = []) {
        super(health, canvasSymbol);
        this.inventory = [];

        this.name = name;
        //for dialogues, pass in arrays! We'll cycle through the array in the output.
        this.contactDialogue = contactDialogue;
        this.defeatDialogue = defeatDialogue;
    }
    //same as Player method.
    addToInventory(newCard) {
        let alreadyHave = false;
        for(let i = 0; i < this.inventory.length; i++){
            if(newCard.id == this.inventory[i].id){
                this.inventory[i].quantity = this.inventory[i].quantity + 1;
                alreadyHave = true;
            }
        }
        if(!alreadyHave){
            this.inventory.push(newCard);
        }
        this.game.updateInventoryDisplay();
    }

    //also initializes the encounter screen.
    async placeCards(inTowerRange) {
        //check tower range. Pick 2/3 random slots.
        //Pick random cards. Enemy's cards will have cooldowns. However, enemy will have enough cards to sustain 3 card turns.
        //fire cards. This is essentially same as player turn sequence.
        var enemyCardPositions = [];
        var enemyCards;
        if(inTowerRange){
            enemyCards = 2;
        } else {
            enemyCards = 3;
        }

        //Generate random card positions.
        //Might need to be moved to another function if player messes with this.
        for(let i = 0; i < enemyCards; i++){
            //random number from 1 - 5, 6 exclusive.
            let n = Math.floor(Math.random()*6)
            //Thank you to https://stackoverflow.com/questions/2380019/generate-unique-random-numbers-between-1-and-100 !
            if(enemyCardPositions.indexOf(n) === -1){ //if index not found, push n to card positions.
                enemyCardPositions.push(n);
            }
        }

        //Place random cards.
        //AMENDEMENT: Actually, go in inventory order. Makes the enemy more predictable, when you learn its moves.
        //needs to account for card order?
        let index = 0;
        for(let j = 0; j < this.inventory.length; j++){
            //if played the number of cards.
            if(index == enemyCards){
                break;
            }
            if(this.inventory[j].onCooldown == 0){
                this.inventory[j],cardPlayed(index);
                index = index + 1;
            }
        }
        //if ran out of cards, play filler card:
        if(index < enemyCards){
            //play filler card.
        }
    }
}