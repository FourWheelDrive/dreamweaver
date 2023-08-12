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

        this.entityHost = []; //does this cell have any entities on it?

        //call an initialize function to make the card without making super duper long constructor.
        this.initializeCard(id);
    }

    //SUPER MEGA NOTE: ADD HOVER LISTENER and a DISPLAY somewhere to show full cards and effect explanations when hovered.
    //Condensed symbols shown normally.

    //switch id to set this attributes.
    initializeCard() {
        var attributeArray = [];
        switch (this.id) {
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
            //REMINDER! Since cooldowns iterated at the end of a turn, cooldown = 1 is instant.
            case 0:
                attributeArray = [
                    "Patience",
                    "p",
                    "A learned virtue. Or perhaps a curse?",
                    "Skip your turn.",
                    0,
                    "opposition",
                    "none",
                    0];
                break;
            case -1:
                attributeArray = [
                    "Attack",
                    "P",
                    "A test card, created to test cards.",
                    "Deal 4 damage to the enemy.",
                    //Owner is owner.
                    4,
                    "opposition",
                    "none",
                    2];
                break;
            case -2:
                attributeArray = [
                    "Heal",
                    "A",
                    "A reverse test card, created to reverse card tests.",
                    "Deal -4 damage to thy self.",
                    //Owner is owner.
                    4,
                    "self",
                    "none",
                    2];
                break;
            case -3:
                attributeArray = [
                    "Attack 2",
                    "P",
                    "Enemy test card",
                    "Deal 4 damage to the enemy,",
                    //Owner is owner.
                    4,
                    "opposition",
                    "none",
                    3];
                break;
        }
        this.name = attributeArray[0];
        this.type = attributeArray[1];
        this.lore = attributeArray[2];
        this.description = attributeArray[3];

        this.magnitude = attributeArray[4];
        this.target = attributeArray[5];
        this.effect = attributeArray[6];

        this.cooldown = attributeArray[7];
    }

    //this needs to deal damage to target and apply effects.
    //How to proccess effects? >>Process at the end of the turn. Separate effect object?
    //position in queue: 0-4

    //might need 2 methods. 1 when drag-drop update, and 1 to evaluate card.
    //Drag-Drop Update
    cardPlayed(position, game) {
        this.onCooldown = this.cooldown; //put on cooldown.
        //If not "Patience":
        if (this.owner.constructor.name == "Player" && this.id != 0) {
            //Grey out the card tile.
            this.domElement.style.opacity = 0.5;

            //Remove charge.
            this.quantity = this.quantity - 1;
            //remove from inventory if used up.
            if (this.quantity == 0 && this.id != 0) {
                this.owner.removeFromInventory(this);
            }
        }

        //Update display screen.
        document.getElementById(`gamePage__gameSpace__combat__cardOrder__${position}__name`).innerHTML = this.name;
        document.getElementById(`gamePage__gameSpace__combat__cardOrder__${position}__magStat`).innerHTML = this.quantity;
        //Add this card to the Queue.
        game.cardQueue[position] = this;
        game.filledCardPositions.push(position);
        //console.log(this.owner.game.gameState); //<-- find game in owner object.
        //^^^^ passed in game instead for better readability.
    }
    //Evaluation Check
    //EFFECTS should also be handled here.
    cardEvaluated(game) {
        switch (this.owner.constructor.name) {
            case "Player":
                if (this.target == "opposition") {
                    game.currentEnemy.changeHealth(this.magnitude);
                    //enemy.addEffect();
                }
                if (this.target == "self") {
                    this.owner.changeHealth(this.magnitude * -1);
                }
                break;
            case "Enemy":
                if (this.target == "opposition") {
                    game.player.changeHealth(this.magnitude);
                    //enemy.addEffect();
                }
                if (this.target == "self") {
                    this.owner.changeHealth(this.magnitude * -1);
                }
                break;
        }
    }

    //handles cooldowns each turn.
    iterateCooldown() {
        if (this.onCooldown > 0) {
            this.onCooldown = this.onCooldown - 1;
        } else if (this.onCooldown == 0 && this.owner.constructor.name == "Player") {
            this.domElement.style.opacity = 1.0;
        }
    }
}