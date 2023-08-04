class Card {
    constructor(id, owner, quantity = 1) {
        this.name;
        this.type; //P or A
        this.lore;
        this.description;
        this.owner = owner; //Player or enemy. Enemy might need an identifyer now, since they're on board?

        this.magnitude;
        this.target; //opposition or self.
        this.effect; //buffs/debuffs.

        this.cooldown; //For combat. Turn cooldown.
        this.onCooldown = 0;    //tracks turns until cooldown lifted.
        this.price;    //in Wishes. For forging.

        this.quantity = quantity;//Tracker for inventory purposes. Tracks # charges.
        this.id = id; //ID for quick identification in code.
        this.domElement; //DOM Element for quick processing.

        //call an initialize function to make the card without making super duper long constructor.
        this.initializeCard(id);
    }

    //SUPER MEGA NOTE: ADD HOVER LISTENER and a DISPLAY somewhere to show full cards and effect explanations when hovered.
    //Condensed symbols shown normally.

    //switch id to set this attributes.
    initializeCard(id) {
        var attributeArray = [];
        switch (id) {
            /*
            [
                name
                type
                description  <= includes: MAGNITUDE, TARGET, EFFECT.
                magnitude
                target       <= opposition or self
                effect
            ]
            */
            case -1:
                attributeArray = [
                    "Test Card",
                    "P",
                    "A test card, created to test cards.",
                    "Deal 4 damage to the enemy.",
                    //Owner is owner.
                    4,
                    "opposition",
                    "none"];
                break;
            case -2:
                attributeArray = [
                    "Test Baguette",
                    "A",
                    "A test baguette, hon hon.",
                    "Deal 4 damage to thy self.",
                    //Owner is owner.
                    4,
                    "self",
                    "none"];
                break;
            case -3:
                attributeArray = [
                    "Enemy test",
                    "P",
                    "Enemy test card",
                    "Deal 4 damage to the enemy,",
                    //Owner is owner.
                    4,
                    "opposition",
                    "none"];
                break;
        }
        this.name = attributeArray[0];
        this.type = attributeArray[1];
        this.lore = attributeArray[2];
        this.description = attributeArray[3];

        this.magnitude = attributeArray[4];
        this.target = attributeArray[5];
        this.effect = attributeArray[6];
    }

    //this needs to deal damage to target and apply effects.
    //How to proccess effects? >>Process at the end of the turn. Separate effect object?
    //position in queue: 0-4

    //might need 2 methods. 1 when drag-drop update, and 1 to evaluate card.
    //Drag-Drop Update
    cardPlayed(position, game) {
        this.onCooldown = this.cooldown; //put on cooldown.
        //Enemy has no card tile.
        if(this.owner.constructor.name == "Player"){
            this.domElement.style.opacity = 0.5;
        }

        //Update display screen.
        document.getElementById(`gamePage__gameSpace__combat__cardOrder__${position}__name`).innerHTML = this.name;
        document.getElementById(`gamePage__gameSpace__combat__cardOrder__${position}__magStat`).innerHTML = this.quantity;
        //Add this card to the Queue.
        game.cardQueue[position] = this;
        game.filledCardPositions.push(position);

        //remove charge.
        if (this.owner.constructor.name == "Player") {
            this.quantity = this.quantity - 1;

            //remove from inventory if used up.
            if (this.quantity == 0) {
                this.owner.removeFromInventory(this);
            }
        }
        //console.log(this.owner.game.gameState); //<-- find game in owner object.
        //^^^^ passed in game instead for better readability.
    }
    //Evaluation Check
    //EFFECTS should also be handled here.
    cardEvaluated(enemy) {
        if(this.target == "opposition"){
            enemy.changeHealth(this.magnitude);
            //enemy.addEffect();
        }
        if(this.target == "self"){
            this.owner.changeHealth(this.magnitude*-1);
        }
    }

    //handles cooldowns each turn.
    iterateCooldown() {
        if (this.onCooldown > 0) {
            this.onCooldown = this.onCooldown - 1;
        } else if (this.onCooldown == 0){
            this.domElement.style.opacity = 1.0;
        }
    }
}