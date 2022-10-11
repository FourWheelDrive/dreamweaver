/*
Contents [globalUtilityScript.js]:
1) Global classes.
1.1) Entity
1.1.1) Player
1.1.2) Enemy
1.2) Attack
1.3) Item

1.4) Cell
1.4.1) Path Cell
1.4.2) Wall Cell
1.4.3) Start Cell
1.4.4) Encounter Cell
1.4.5) Objective Cell

1.5) Game

2) Global Variables
3) Global Functions.
3.1) sleep(ms)
3.2) flushCSS(element)
3.3) buttonCooldownTimer(buttonID, time)
3.4) updateInvDisplay?????????
3.5) randInt

4) Cooldown Handler Classes
4.1) Cooldown Manager
4.2) Cooldown Data
*/

//=====================================================ENTITY-based classes
/*
Contents [class ENTITY]:
1) Health
2) Canvas display elements
2.1) symbol
2.2) y position
3) Attack
3.1) Cooldown boolean
3.2) Attack array
*/

class Entity {
    constructor(health, canvasSymbol) {
        this.health = health;
        this.canvasSymbol = canvasSymbol;

        /*Entity can have a few stances:
        Idle ""
        Channelling "Channelling"
        Attacking "Attacking"
        Parrying "Parrying" */
        this.status = "";
        /*Special Effects list, for now
        Heavy Armour?
        Stun 
        can only apply 1 buff/debuff to an entity at a time. Adding another replaces!*/
        this.buff = null;
        this.debuff = null;

        //Canvas stuff.
        this.actionLine = this.status;                  //action: attacking, parrying
    }

    changeHealth(difference) {
        if (this.status != "parrying") {
            if (game.gameState == "encounter") {
                this.health = this.health - difference;
            } else {
                return;
            }

            //TAG: FLAG CHECK
            //Check if healed past maxHealth.
            if (this instanceof Player && this.health > this.maxHealth) {
                this.health = this.maxHealth;
            }

            //depending on who got hit, change the health display.
            if (this instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = this.health;
                document.getElementById("gamePage__footer__health").innerHTML = `Health: ${this.health}/${this.maxHealth}`;
            }
            if (this instanceof Enemy) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = this.health;
            }

            //Check if encounter ends. If target health <= 0.
            if (this.health <= 0) {
                game.encounterEnds();
                return;
            }
            return false;
        } else {
            //if the player is parrying, return failed attack.
            return true;
        }
    }
    changeStatus(newStatus, id = -1) {
        if (newStatus == "channelling" && this instanceof Player) { //for channelled attacks, update the global channelled attack id.
            game.channelledID = id;
        }
        this.status = newStatus;
        //depending on caller, update statusLine.
        if (this instanceof Player) {
            document.getElementById("gamePage__gameSpace__encounter__canvas__playerStatus").innerHTML = this.status;
        }
        if (this instanceof Enemy) {
            document.getElementById("gamePage__gameSpace__encounter__canvas__enemyStatus").innerHTML = this.status;
        }
    }
    //pass in a statusEffect object. Add.
    addStatusEffect(statusEffect) {
        switch (statusEffect.type) {
            case "buff":
                this.buff = statusEffect;
                if (this instanceof Player) {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                } else {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                }
                break;
            case "debuff":
                this.debuff = statusEffect;
                if (this instanceof Player) {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                } else {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                }
                break;
        }
    }
    clearStatusEffect(operation) {
        if (operation == "buff") {
            this.buff = null;
            if (this instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = `+`;
            } else {
                document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = `+`;
            }
        }
        if (operation == "debuff") {
            this.debuff = null;
            if (this instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `-`;
            } else {
                document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `-`;
            }
        }
    }
}
class Player extends Entity {
    constructor(maxHealth, canvasSymbol) {
        super(maxHealth, canvasSymbol);
        this.maxHealth = maxHealth;                     //health and maxHealth are set to the same, initially.
        this.attacks = [null, null, null, null];        //Array of attack objects.

        this.inventory = [];          //Array of item objects.
        this.inventoryButtonData = []; //relates buttons to attacks.
        this.inventoryPointerPosition = 0;

        //Masquerade multipliers!
        this.masquerade = 0;
        //array index 0 for multipliers is base. Thus, masquerade = 0 is base.
        this.damageMulti = [1, 1, 1.5, 2, 2.5, 3] //math.floor and multiply base damage by these. Scales well for baseDMG 1-3.
        this.healthMulti = [10, 9, 8, 7, 6, 5];

        this.wishes = 0;

        this.mapPosition = [];

        //set up header.
        document.getElementById("gamePage__footer__health").innerHTML = `Health: ${this.health}/${this.maxHealth}`;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
        document.getElementById("gamePage__footer__masquerade").innerHTML = `Masquerade: ${this.masquerade}`;
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
    //Map methods
    getInitialPosition(mapWidth, mapHeight) {
        this.mapPosition = [(mapWidth - 1) / 2, (mapHeight - 1) / 2];
    }
    //Wishes.
    addWishes(difference) {
        this.wishes = this.wishes + difference;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
    }
    //Methods for masquerade.
    //Updates stats, but ALSO CALLS ANIMATION.
    async updateMasqueradeStats(operation) { //operation is -1 or 1. -1 is heal, 1 is death.
        //clear cooldowns.
        cooldownHandler.clearCooldowns();
        switch (operation) {
            case -1:
                //healing has different dialogues. only appears on some masks.
                break;
            case 1:
                //update screen and play defeat animation
                game.gameState = "masquerade"
                fadeElement("out", document.getElementById("gamePage"), 1);

                this.masquerade = this.masquerade + 1;
                //check if the player has actually lost.
                let message1;
                let message2;
                switch (this.masquerade) {
                    case 1:
                        message1 = `Defeat stings.`
                        message2 = `HP decreased.`
                        break;
                    case 2:
                        message1 = `Adversity is a harsh mentor.`
                        message2 = `ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 3:
                        message1 = `i forgor what to put here`
                        message2 = `ATK increased. <br> 
                    HP decreased.`
                        break;
                    case 4:
                        message1 = `Exercise caution. It is dark beyond.`
                        message2 = `ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 5:
                        message1 = `One stares into the abyss.`
                        message2 = `The abyss stares back. <br>
                        <br>
                        ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 6: //loss case
                        return game.loseGame();
                }
                let masqueradeWindow = document.getElementById("masquerade__lossScreen");
                let maskOutput1 = document.getElementById("masquerade__lossScreen__output1");
                let maskOutput2 = document.getElementById("masquerade__lossScreen__output2");
                maskOutput1.innerHTML = message1;
                maskOutput2.innerHTML = message2;
                masqueradeWindow.style.display = "flex";
                fadeElement("in", masqueradeWindow, 1);
                await sleep(5000);

                //update attack parameters.
                for (var i = 0; i < player.inventory.length; i++) {
                    if (player.inventory[i] instanceof Attack) {
                        player.inventory[i].applyMasqueradeMulti();
                        try {
                            player.inventory[i].statusApplyMasqueradeMulti();
                        } catch (e) { }
                    }
                }
                //update health.
                this.maxHealth = this.healthMulti[this.masquerade];
                game.gameState = "encounter";       //Temporary flag update to let changeHealth through.
                this.changeHealth(-100, this);
                this.clearStatusEffect("buff");
                this.clearStatusEffect("debuff");
                game.gameState = "masquerade";
                //update displays.
                document.getElementById("gamePage__footer__masquerade").innerHTML = `Masquerade: ${this.masquerade}`;
                //Update map => cell needs to be reset.
                mapArray[this.mapPosition[0]][this.mapPosition[1]].visitNumber = mapArray[this.mapPosition[0]][this.mapPosition[1]].visitNumber - 1;

                //return to game.
                clearPlayer(mapArray, true);
                this.getInitialPosition(mapWidth, mapHeight); //reset player position
                showPlayer();
                fadeElement("out", masqueradeWindow, 1);
                fadeElement("in", document.getElementById("gamePage"), 1);
                game.gameState = "movement";
                break;
        }
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack, contactDialogue = [], defeatDialogue = []) {
        super(health, canvasSymbol);
        this.attack = attack;
        this.attackInterval;

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
            if (game.gameState == "encounter") {
                this.attack.attackProcced(enemy, player, cooldownHandler);
            }
        }, this.attack.baseCooldown * 1000);
    }
}

//=====================================================Combat utility classes
//Might need to add a tier system! Or maybe just keep it all the same? Player can build combos or change multipliers?
class Attack {
    constructor(name, damage, cooldown, channelling, description, effectObject = null) {
        //data stats
        this.name = name;
        this.id = game.nextInventoryObjectId;              //identifies the object. Could differentiate between the same type.
        game.nextInventoryObjectId = game.nextInventoryObjectId + 1;
        this.equipped = false;                          //identifies whether or not, from inventory, attack is equipped.
        this.description = description;
        //combat stats
        this.baseDamage = damage;                       //Masquerade multiplier applied to player baseDMG, baseCd. But only for player.
        this.baseCooldown = cooldown;
        this.baseChannelling = channelling;
        /*Effects
        - none: none.
        - parry: Deflect enemy attacks for effectDuration.
        - heal: apply negative damage to yourself.

        - stun: for a certain number of attacks, attack does not land.
        */
        this.effectObject = effectObject;

        //Effectual stats
        this.damage;
        this.cooldown;
        this.channelling;

        /*Attacks have four phases:
        Idle            - ready to be procced
        Channelling     - procced, delay before fire. Any other action cancels.
        Attacking       - Attack hits, do damage.
        Cooldown        - Cooldown begins after proc. Can't be procced in this time.
        */
        this.status = "idle"; //use in cooldown system.

        //apply modifiers.
        this.applyMasqueradeMulti();
    }
    //Call this when enemy or player procs attack.
    async attackProcced(caller, target) {
        //Step 0: await channelling.
        //Timeout with sleep().
        //NOTE: It's possible I could await a setTimeout here.
        if (this.baseChannelling != 0) {
            caller.changeStatus("channelling", this.id);
            await sleep(this.baseChannelling * 1000);
        }

        //NOTE: there is probably a better way to apply effects. As it stands, I'm switch()ing.
        //==================Step 1: Apply status effects!

        //change necessary parameters here.
        //Apply changes depending on each buff or debuff
        //==================Step 1.1: call .applyEffect on all buffs/debuffs to check what is happening.
        var attackAborted = false; //<-- this is necessary. can't return instead, because we need to iterate durations.
        //if caller is player: (OFFENSIVE parameters)
        if (caller instanceof Player) {
            //==========OFFENSIVE PLAYER BUFFS===========
            if (caller.buff != null) {
                switch (caller.buff.effect) {
                    //Buffs_____________
                    case "barrier":
                        break;
                }
            }
            //==========OFFENSIVE PLAYER DEBUFFS===========
            if (caller.debuff != null) {
                switch (caller.debuff.effect) {
                    //Debuffs_____________
                    case "stun":
                        game.canvasOutput("You are stunned!");
                        caller.changeStatus("");
                        attackAborted = true;
                        break;
                    case "bleed":
                        game.canvasOutput(`Bled ${caller.debuff.magnitude} health.`);
                        caller.changeHealth(caller.debuff.magnitude);
                        break;
                    case null:
                        break;
                }
            }

            //==========DEFENSIVE ENEMY BUFFS===========
            if (target.buff != null) {
                //==========ENEMY BUFFS===========
                switch (target.buff.effect) {
                    //Buffs_____________
                    case "barrier":
                        //if attacking into a barrier, throw.
                        if (this.effectObject != null && this.effectObject.effect == "pierce") {
                            game.canvasOutput("Struck through the shield.");
                            break;
                        } else { //Else, block the attack.
                            game.canvasOutput("The enemy's barrier flares!");
                            attackAborted = true;
                            break;
                        }
                }
            }
            //==========DEFENSIVE ENEMY DEBUFFS===========
            if (target.debuff != null) {
                switch (target.debuff.effect) {
                    //Debuffs_____________
                    case "stun":
                        break;
                    case "bleed":
                        game.canvasOutput(`Enemy bleeds ${target.debuff.magnitude} health.`);
                        target.changeHealth(target.debuff.magnitude);
                        break;
                    case null:
                        break;
                }
            }
        }
        //if caller is enemy: (DEFENSIVE parameters)
        if (caller instanceof Enemy) {
            //==========OFFENSIVE ENEMY BUFFS===========
            if (caller.buff != null) {
                switch (caller.buff.effect) {
                    //Buffs_____________
                    case "barrier":
                        break;

                }
            }
            //==========OFFENSIVE ENEMY DEBUFFS===========
            if (caller.debuff != null) {
                switch (caller.debuff.effect) {
                    //Debuffs_____________
                    case "stun":
                        game.canvasOutput("Enemy is stunned!");
                        caller.changeStatus("");
                        attackAborted = true;
                        break;
                    case "bleed":
                        game.canvasOutput(`Enemy bleeds ${caller.debuff.magnitude} health.`)
                        caller.changeHealth(caller.debuff.magnitude);
                        break;
                    case null:
                        break;
                }
            }

            //==========DEFENSIVE PLAYER BUFFS===========
            if (target.buff != null) {
                switch (target.buff.effect) {
                    //Buffs_____________
                    case "barrier":
                        //if receiving a piercing attack, throw.
                        if (this.effectObject != null && this.effectObject.effect == "pierce") {
                            game.canvasOutput("The enemy attack pierces your barrier!");
                            break;
                        } else { //Else, block the attack.
                            game.canvasOutput("Attack deflected by barrier!");
                            attackAborted = true;
                            break;
                        }
                }
            }
            //==========DEFENSIVE PLAYER DEBUFFS===========
            if (target.debuff != null) {
                switch (target.debuff.effect) {
                    //Debuffs_____________
                    case "stun":
                        break;
                    case "bleed":
                        game.canvasOutput(`Bled ${target.debuff.magnitude} health!`);
                        target.changeHealth(target.debuff.magnitude);
                        break;
                    case null:
                        break;
                }
            }
        }

        //=================Step 1.2: iterate effects.
        if (caller.buff != null) { caller.buff.iterateDuration(); }
        if (caller.debuff != null) { caller.debuff.iterateDuration(); }
        if (target.buff != null) { target.buff.iterateDuration(); }
        if (target.debuff != null) { target.debuff.iterateDuration(); }
        //=================Step 1.3: If the attack was nullified by an effect, abort.
        if (attackAborted) {
            caller.changeStatus("");
            return;
        }

        //==================Step 2: Apply changes to game and Entities. After channelling, attack
        //==================Step 3: Update display elements
        var attackParried;
        var tempAppliedStatus;
        //Copy of the current statuseffect, if possible.
        if (this.effectObject != null) {
            if (caller instanceof Enemy) {
                var statusEffectCopy = new StatusEffect(enemy, this.effectObject.effect, this.effectObject.duration, this.effectObject.attackIterative, this.effectObject.magnitude, this.effectObject.effectDescription);
            }
            if (caller instanceof Player) {
                var statusEffectCopy = new StatusEffect(player, this.effectObject.effect, this.effectObject.duration, this.effectObject.attackIterative, this.effectObject.magnitude, this.effectObject.effectDescription);
            }
        }
        if (this.effectObject == null) { //Standard attack, no effect.
            //standard damaging attack.
            //always check if the channeling has been interrupted.
            //  2 cases! one for player, one for enemy(check for parry)
            //Blanket check if encounter is still ongoing and if player is not in inventory.
            if (game.gameState == "encounter" && game.windowState == "fight") {
                //if the player is channelling AND the channelled id is current attack.
                if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                    tempAppliedStatus = "attacking";
                    caller.changeStatus(tempAppliedStatus);
                    target.changeHealth(this.damage);
                    //Step 2: update display.
                    game.canvasOutput(`You hit the enemy for ${this.damage} damage!`);
                    //just for reaction's sake, show attack status.
                    await sleep(300);
                }

                if (caller instanceof Enemy) {
                    tempAppliedStatus = "attacking";
                    caller.changeStatus(tempAppliedStatus);
                    attackParried = target.changeHealth(this.damage);//check if the player is parrying or not.
                    if (!attackParried) {
                        game.canvasOutput(`The enemy hit you for ${this.damage} damage!`);
                    } else if (attackParried) {
                        game.canvasOutput(`You parried the enemy attack.`);
                    }
                }
            }
        } else {                         //Special effect attacks.
            switch (this.effectObject.effect) {
                //NOTE: Rework these two to use effectObjects.
                case "parry":
                    tempAppliedStatus = "parrying";
                    caller.changeStatus(tempAppliedStatus);
                    await sleep(this.effectObject.duration * 1000);
                    break;
                case "heal":
                    //always check if the channeling has been interrupted.
                    if ((caller.status == "channelling" && game.channelledID == this.id) || this.baseChannelling == 0) {
                        tempAppliedStatus = "healing";
                        caller.changeStatus(tempAppliedStatus);
                        caller.changeHealth(this.damage); //health applied to self.

                        //Step 2: update display
                        if (caller instanceof Player) {
                            if (caller.health >= caller.maxHealth) {
                                game.canvasOutput(`You are at max health!`);
                            } else {
                                game.canvasOutput(`You recovered ${-1 * this.damage} health.`);
                            }
                        }
                        if (caller instanceof Enemy) {
                            game.canvasOutput(`The enemy recovered ${-1 * this.damage} health.`);
                        }
                    }
                    break;

                //Special effect cases. These apply buff to self/debuff to enemy.
                //Buffs:
                //Buffs do not check for parry, because they apply to oneself.
                case "barrier":
                    //if the player is channelling AND the channelled id is current attack.
                    //Blanket check if encounter is still ongoing and if player is not in inventory.
                    if (game.gameState == "encounter" && game.windowState == "fight") {
                        if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                            tempAppliedStatus = "casting";
                            caller.changeStatus(tempAppliedStatus);
                            caller.addStatusEffect(statusEffectCopy);
                            game.canvasOutput("Barrier online!");
                            await sleep(300);
                        }
                    }
                    if (caller instanceof Enemy) {
                        tempAppliedStatus = "casting";
                        caller.changeStatus(tempAppliedStatus);
                        caller.addStatusEffect(statusEffectCopy);
                        game.canvasOutput("Enemy barrier online!");

                        attackParried = target.changeHealth(this.damage, target);//check if the player is parrying or not.
                        if (!attackParried) {
                            target.addStatusEffect(statusEffectCopy);
                            game.canvasOutput(`Bleeding!`);
                        } else if (attackParried) {
                            game.canvasOutput(`Parried the strike.`);
                        }
                    }
                    break;
                //Debuffs:
                case "stun":
                    //if the player is channelling AND the channelled id is current attack.
                    //Blanket check if encounter is still ongoing and if player is not in inventory.
                    if (game.gameState == "encounter" && game.windowState == "fight") {
                        if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                            tempAppliedStatus = "casting";
                            caller.changeStatus(tempAppliedStatus);
                            target.addStatusEffect(statusEffectCopy);
                            game.canvasOutput(`Stunned the enemy!`);
                            await sleep(300);
                        }
                        if (caller instanceof Enemy) {
                            tempAppliedStatus = "casting";
                            caller.changeStatus(tempAppliedStatus);

                            attackParried = target.changeHealth(this.damage, target);//check if the player is parrying or not.
                            if (!attackParried) {
                                target.addStatusEffect(statusEffectCopy);
                                game.canvasOutput(`Stunned!`);
                            } else if (attackParried) {
                                game.canvasOutput(`Avoided the stun.`);
                            }
                        }
                    }
                    break;
                case "bleed":
                    //if the player is channelling AND the channelled id is current attack.
                    //Blanket check if encounter is still ongoing and if player is not in inventory.
                    if (game.gameState == "encounter" && game.windowState == "fight") {
                        if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                            tempAppliedStatus = "casting";
                            caller.changeStatus(tempAppliedStatus);
                            target.addStatusEffect(statusEffectCopy);
                            game.canvasOutput("The foe bleeds.");
                            await sleep(300);
                        }
                    }
                    if (caller instanceof Enemy) {
                        tempAppliedStatus = "casting";
                        caller.changeStatus(tempAppliedStatus);

                        attackParried = target.changeHealth(this.damage, target);//check if the player is parrying or not.
                        if (!attackParried) {
                            target.addStatusEffect(statusEffectCopy);
                            game.canvasOutput(`Bleeding!`);
                        } else if (attackParried) {
                            game.canvasOutput(`Parried the strike.`);
                        }
                    }
                    break;
            }
        }
        //==================Step 4: Reset board.
        //after action, check if the move hasn't been interrupted and reset status.
        if (caller.status == tempAppliedStatus) {
            caller.changeStatus("");
        }
        //Also reset stats that have been changed!
        this.applyMasqueradeMulti();
        if (this.effectObject != null) {
            this.effectObject.statusApplyMasqueradeMulti();
        }
    }
    //when masquerade gets updated, change stats.
    //Also call this on initialization for new attack objects!
    applyMasqueradeMulti() {
        //NOTE: masquerade may change other parameters depending on attack in the future. Cooldown, effectDur, channelling
        this.damage = Math.floor(this.baseDamage * player.damageMulti[player.masquerade]);
    }
}
class StatusEffect {
    constructor(parent, effect, duration = null, attackIterative = false, magnitude = null, effectDescription = null) {
        this.parent = parent;
        this.target;
        if (this.parent instanceof Enemy) {
            this.target = player;
        } else {
            this.target = enemy;
        }
        this.duration = duration;
        this.magnitude = magnitude;
        this.attackIterative = attackIterative;
        this.remainingDuration = duration;

        this.effect = effect;
        this.effectDescription = effectDescription; //for display purposes.
        this.type;
        switch (this.effect) {
            //buffs
            //debuffs
            case "stun":
                this.type = "debuff";
                break;
            case "bleed":
                this.type = "debuff";
                break;
            case "barrier":
                this.type = "buff";
                break;
        }
        this.statusApplyMasqueradeMulti();
    }
    //when the affected entity makes an attack, iterate duration.
    iterateDuration() {
        if (this.attackIterative) {
            this.remainingDuration = this.remainingDuration - 1;
            switch (this.type) {
                case "buff": //targets this.parent
                    //update displays
                    if (this.parent instanceof Player) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    } else if (this.parent instanceof Enemy) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    }
                    if (this.remainingDuration <= 0) { this.parent.clearStatusEffect(this.type); }
                    break;
                case "debuff": //targets this.target
                    //update displays
                    if (this.target instanceof Player) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    } else if (this.target instanceof Enemy) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    }
                    if (this.remainingDuration <= 0) { this.target.clearStatusEffect(this.type); }
                    break;
            }
        }
        return;
    }
    //This also needs to apply masquerade! If duration changes.
    //NOTE: difference in durations happen here.
    statusApplyMasqueradeMulti() { }
}

class Item {
    /*
    requires
    this.equipped
    this.id, uses nextInventoryObjectId like attacks.
    */
}

//cooldown handler
class CooldownHandler {
    constructor() {
        this.attackUCooldown;
        this.attackICooldown;
        this.attackJCooldown;
        this.attackKCooldown;
    }
    clearCooldowns() {
        clearTimeout(this.attackUCooldown);
        clearTimeout(this.attackICooldown);
        clearTimeout(this.attackJCooldown);
        clearTimeout(this.attackKCooldown);
        document.getElementById("gamePage__gameSpace__encounter__menu__button1").disabled = false;
        document.getElementById("gamePage__gameSpace__encounter__menu__button2").disabled = false;
        document.getElementById("gamePage__gameSpace__encounter__menu__button3").disabled = false;
        document.getElementById("gamePage__gameSpace__encounter__menu__button4").disabled = false;
    }
}

//=====================================================GAME class
/*
Contents [class GAME]:
*/
//var encounterPromiseResolve;
//var encounterPromiseReject;
class Game {
    constructor() {
        this.gameState = "movement";
        this.windowState = "map";
        /*
        CHANGES TO GAME.GAMESTATE.
        game.gameState tracks what the game is doing right now.
        - movement
        - encounter => tempTransition (for dialogues, but disables attacks)
        - shop
        - masquerade => disables everything. Defeat dialogue.

        window.windowState tracks which screen the player is on.
        - map
        - fight
        - result (win fight, no attacks can be procced)
        - death (not yet made, on player death.)
        - inventory
        - shop

        Use these in conjunction to flag which events are and aren't allowed to fire.
        */

        this.currentRoom = 1;
        this.roomBossCellEntity;                            //the object of the cell for outside reference.
        this.gameTime = 0;                                  //Serves as moveCounter.
        this.encounterCounter = 0;                          //tracks number of battles. Might be more useful if track moves since last battle?
        this.gameDialogueIntervals = ["1B"] //These are not actually times! These are turn intervals between dialogues. Can be movement or battle based.

        this.nextInventoryObjectId = 1;                        //increments as attacks and items are created.
        this.channelledID;                                  //identifies currently channelled attack. Helps differentiate if a channel interrupts another.

        //flags.
        this.encounterPromiseResolve = function () { };
        this.encounterPromiseReject = function () { };
        //-----------------------------------------------------------------------------
        //Multipliers for game progression.
        this.attackMultiplier = 1;                      //increases with mask
        this.healthMultiplier = 1;                      //decreases with mask
        this.parryCooldownMultipler = 1;                //increases with mask
        this.parryDurationMultiplier = 1;               //decreases with mask.

        //shop inventory.
        this.shopInventory = [];
    }
    canvasOutput(newMessage) {
        var outputs = [document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1"),
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2"),
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3")];

        for (var i = outputs.length - 1; i > -1; i--) {
            if (i > 0) {
                outputs[i].innerHTML = outputs[i - 1].innerHTML;
            }
            if (i == 0) {
                outputs[i].innerHTML = newMessage;
            }
        }
    }

    //Sequence functions: called per room.
    //Encounter functions: called per individual fight.
    async sequenceBegins(sequenceLength, tier = 1, boss = null) {
        //actually big brain this one, automatically switch to encounter screen.
        this.gameState = "encounter"; //<-- this is actually just here to keep the screen's opacity 1.0.
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__encounter").style.display != "grid")

        //For sequence length, generate new enemies.
        // Also generates enemies (different cases for different cells). special case for bosses.
        for (var i = 0; i < sequenceLength; i++) {
            let encounterLost = false;
            //Generate a new enemy.
            if (boss) { //BOSS ROOM CASE
                if (i == sequenceLength - 1) {
                    enemy = boss;
                } else {
                    //replace with special enemies for each room's boss.
                    enemy = entityDatabase.generateTier1Enemy(1);
                }
            } else { //REGULAR CASE
                //replace with enemies for each cell type and room.
                enemy = entityDatabase.generateTier1Enemy(1);
            }
            //NOTE: generate new enemies here, instead of in encounterBegins(). Use entityDatabase methods.
            this.encounterBegins();
            let encounterPromise = await new Promise(function (resolve, reject) {
                game.encounterPromiseResolve = resolve;
                game.encounterPromiseReject = reject;
            }).then(
                result => {
                },
                error => {
                    //hide canvas. From sequenceEnds().
                    document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
                    //auto switch back to the map.
                    this.gameState = "movement";
                    do {
                        document.getElementById("gamePage__header__left").click();
                    } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
                    //reset encounter screen.
                    document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
                    //clear cooldowns.
                    cooldownHandler.clearCooldowns();

                    //catch things and end the loop.
                    encounterLost = true;
                }
            );
            //Break the for loop and exit sequence.
            if (encounterLost) {
                return;
            }
        }
        //when the enemies are all dead, end sequence.
        this.sequenceEnds(sequenceLength, boss);
    }
    async sequenceEnds(sequenceLength, boss = null) {
        if (boss) {//BOSS CASE
            //we co-opt Masquerade screen for this lol
            let newWishes = 5;
            player.addWishes(newWishes);
            fadeElement("out", document.getElementById("gamePage"), 1);

            let masqueradeWindow = document.getElementById("masquerade__lossScreen");
            let maskOutput1 = document.getElementById("masquerade__lossScreen__output1");
            let maskOutput2 = document.getElementById("masquerade__lossScreen__output2");
            switch (this.currentRoom) { //dialogues for each room.
                case 1:
                    maskOutput1.innerHTML = "The beast lies still.";
                    maskOutput2.innerHTML = "The boulevard stretches into the mist.";
                    break;
            }

            masqueradeWindow.style.display = "flex";
            fadeElement("in", masqueradeWindow, 1);
            //Generate a new room and reset player.
            this.beginNewRoom();
            //Automatically return to map screen.

            //Disable transition screen.
            await sleep(5000);
            //hide canvas.
            document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
            //auto switch back to the map.
            this.gameState = "movement";
            do {
                document.getElementById("gamePage__header__left").click();
            } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
            //reset canvas
            document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
            //fade back in.
            fadeElement("out", masqueradeWindow, 1);
            fadeElement("in", document.getElementById("gamePage"), 1);
        } else { //NORMAL ENCOUNTER CASE
            //NOTE: wish calculation algs go here.
            let newWishes = Math.floor(sequenceLength / 2);
            if (newWishes < 1) { //get at least 1 wish.
                newWishes = 1;
            }
            pushMainOutput(`You got ${newWishes} Wishes!`);
            //add money.
            player.addWishes(newWishes);
            await sleep(1500);

            //hide canvas.
            document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
            //auto switch back to the map.
            this.gameState = "movement";
            do {
                document.getElementById("gamePage__header__left").click();
            } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
            //reset canvas
            document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
            //clear cooldowns.
            cooldownHandler.clearCooldowns();
        }
    }
    async encounterBegins() {
        //initialize screen
        document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = player.health;

        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";

        //play the opening sequence. Freeze movement.
        this.gameState = "tempTransition";
        for (var i = 0; i < enemy.contactDialogue.length; i++) {
            await sleep(1000);
            pushMainOutput(enemy.contactDialogue[i]);
        }
        //enemy shows up!
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = enemy.canvasSymbol;
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = enemy.health;
        await sleep(1000);

        //Start the fight.
        this.gameState = "encounter";
        enemy.beginAttackSequence();
    }
    async encounterEnds() {
        this.gameState = "tempTransition";
        clearInterval(enemy.attackInterval);
        enemy.attackInterval = null;

        if (player.health <= 0) { //player loses, trigger masquerade.
            this.encounterPromiseReject(); //reject the sequence promise.
            this.clearCanvas(); //Reset the encounter scene.
            //Masquerade update.
            player.updateMasqueradeStats(1);
            return;
        }
        if (enemy.health <= 0) { //player wins! Give rewards, reward screen.
            //Display dialogue!
            for (var i = 0; i < enemy.defeatDialogue.length; i++) {
                pushMainOutput(enemy.defeatDialogue[i]);
                await sleep(1500);
            }
            await sleep(1500);
            this.encounterPromiseResolve();
            this.clearCanvas(); //Reset the encounter scene.
            //OLD RESULTS SCREEN
            /*
            document.getElementById("gamePage__gameSpace__encounter__result").style.display = "flex";
            //Wait until player clicks button to go back.
            await new Promise(resolve => {
                document.getElementById("gamePage__gameSpace__encounter__result__returnButton").addEventListener("click", (e) => {
                    resolve();
                }, { once: true }); //once: true removes the listener after clicked once.
                //any key press will remove both eventlisteners.
                document.addEventListener("keydown", (e) => {
                    document.getElementById("gamePage__gameSpace__encounter__result__returnButton").click();
                }, { once: true }); //once: true removes the listener after clicked once.
            })*/
        }
    }
    clearCanvas() {
        //reset canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";

        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyStatus").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = "";

        document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = "-";
        document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = "-";
        document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = "-";
        document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = "-";

        document.getElementById("gamePage__gameSpace__encounter__canvas__playerStatus").innerHTML = "";
    }

    //Start a new room.
    beginNewRoom() {
        //iterate room.
        this.currentRoom = this.currentRoom + 1;
        //remove children from map canvas.
        var map = document.getElementById("gamePage__gameSpace__map__canvas");
        while (map.firstChild) {
            map.firstChild.remove();
        }
        //generate a new map.
        var maxTunnels = 80, maxLength = 10;
        mapArray = generateNewRoom(game.currentRoom, mapWidth, mapHeight, maxTunnels, maxLength);

        //reset player
        clearPlayer(mapArray, true);
        player.getInitialPosition(mapWidth, mapHeight);

        //show vision
        showCellsInVision(5);
        showPlayer();
    }

    //game win or lose.
    winGame() { }
    loseGame() {
        document.getElementById("masquerade__lossScreen").style.display = "none";
        this.gameState = "masquerade";
        fadeElement("out", document.getElementById("gamePage"), 1);
        document.getElementById("game__over__screen").style.display = "flex";
        fadeElement("in", document.getElementById("game__over__screen"), 1);
    }
}

//=====================================================CELL-based classes
/*
Contents [class CELL]:
All child classes of [CELL] require:
firstVisit()
recurringVisit() (not always) <== case 1 is the first recurrance, case 0 is firstVisit().
*/
class Cell {
    constructor(positionX, positionY) {
        this.name;                             //name shown in encounter popup.
        this.symbol;

        this.mapX = positionX;                          //Map positions.
        this.mapY = positionY;

        this.cellID = `[${positionX}][${positionY}]`;   //HTML DOM ID

        this.visitNumber = 0;
    }
    //func called by other cell types. Depending on caller and room, returns a name.
    cellNameGenerator(type, room) {
        var namesList;
        switch (room) {
            case 1:
                switch (type) { //each room will need this same switch.
                    case "path":
                        //make an array. get random number in arr.length. return element at index.
                        namesList = ["A Dusty Path", "A Desolate Avenue"] //Boulevard, street.
                        return namesList[randInt(namesList.length - 1)];
                    case "minorLocation":
                        namesList = ["A Tattered Square"];
                        return namesList[randInt(namesList.length - 1)];
                    case "bossLocation":
                        return "The Dragon's Lair";
                }
                break;
            case 2:
                break;
            case 3:
                break;
        }
    }
    //func called by other cell types. Returns symbols depending on caller and room.
    cellSymbolGenerator(type, room) {
        var symbolsList;
        if (type == "path") {
            return ";";
        }
        switch (room) {
            case 1:
                switch (type) {
                    case "minorLocation":
                        symbolsList = ["B", "F", "A"];
                        return symbolsList[randInt(symbolsList.length - 1)];
                    case "bossLocation":
                        return "Ψ";
                }
                break;
            case 2:
                break;
        }
    }

    //Visits handler.
    visit() {
        //console.log(this.constructor.name) <-- this works and returns the child constructor name.
        if (this.visitNumber == 0 && this.firstVisit) {
            this.firstVisit();
        } else if (this.recurringVisit) { //Not all cells have recurring visit events.
            this.recurringVisit(this.visitNumber);
        }
        this.visitNumber = this.visitNumber + 1;
    }
    iterateVisits() {
        this.visitNumber = this.visitNumber + 1;
    }
}
class WallCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.name = "";
        this.symbol = "#";
    }
}
//random encounters not done yet.
class PathCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.randomEncounterChance = 0.005;
    }
    //NOTE: randomEncounters can be called from PathCell only!
    randomEncounterCheck() {

    }
    initializeCell() {
        this.name = super.cellNameGenerator("path", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("path", game.currentRoom);
    }
    //visits
    firstVisit() {
        this.randomEncounterCheck();
    }
}

//plentiful encounters. Single encounters?
class MinorEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
    initializeCell() {
        this.name = super.cellNameGenerator("minorLocation", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("minorLocation", game.currentRoom);
    }
    //On first visit
    firstVisit() { //Start encounter.
        game.sequenceBegins(1);
    }
    //On subsequent visits
    recurringVisit(number) {
    }
}
//slightly less plentiful. Chain encounters, could reward with more wishes or items!
class SequenceEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);

        this.sequenceLength = randInt(2) + 1;
    }
    async firstVisit() {

    }
}
//Story cells. Specific characters appear here, depending on ID.
class SpecialEncounterCell extends Cell {
    constructor() {

    }
    firstVisit() {

    }
}
//End of room cells. Sequence enemies, then boss fights.
class BossEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.symbol = "#"; //boss room replaces a wall.
        this.name = "";

        this.storedSymbol;
        this.storedName;
        this.revealed = false;
        //use game.currentRoom to define the room.
    }
    //Init 
    initializeCell() {
        this.storedName = super.cellNameGenerator("bossLocation", game.currentRoom);
        this.storedSymbol = super.cellSymbolGenerator("bossLocation", game.currentRoom);
    }
    //room revealed
    revealBossCell() {
        //update cell!
        this.revealed = true;
        this.symbol = this.storedSymbol;
        this.name = this.storedName;

        var bossCellElement = document.getElementById(`[${this.mapX}][${this.mapY}]`);
        bossCellElement.innerHTML = this.symbol;
        bossCellElement.style.fontWeight = "700";
        bossCellElement.style.fontStretch = "expanded";
        bossCellElement.style.fontSize = "22px";
        showCellsInVision(5);
        showPlayer();
    }

    //visits
    firstVisit() {
        if (!this.revealed) { //if the boss cell hasn't been revealed yet, pretend it hasn't been visited.
            this.visitNumber = 0;
            return;
        }
        //Depending on which room it is, spawn a different boss.
        switch (game.currentRoom) {
            case 1:
                this.room1BossBegins();
                break;
            case 2:
                break;
        }
    }
    room1BossBegins() {
        game.sequenceBegins(1, "B1", entityDatabase.generateBossByName(1));
    }
    room2BossBegins() {

    }
}

//==============================================================Global functions
function randInt(max) { //Random function, maximum inclusive.
    return Math.floor(Math.random() * (max + 1));
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function calcPythagDistance(coordSetOne, coordSetCenter) {
    var differenceX = (coordSetOne[0] - coordSetCenter[0]);
    var differenceY = (coordSetOne[1] - coordSetCenter[1]);

    var distanceFromCenter = Math.sqrt((differenceX) ** 2 + (differenceY) ** 2);
    return distanceFromCenter;
}
//Fades elements in.
async function fadeElement(operation, element, time) { //fade elements in/out
    switch (operation) {
        case "in":
            var newOpacity = 0;
            element.style.opacity = newOpacity;
            var timer = setInterval(function () {
                //if animation is done
                if (element.style.opacity > 1) {
                    clearInterval(timer);
                } else {
                    element.style.opacity = newOpacity;
                    let ticks = (time * 1000) / 10;
                    newOpacity += 1 / ticks;
                }
            }, 10)
            await sleep(time * 1000);
            break;
        case "out":
            var newOpacity = 1;
            element.style.opacity = newOpacity;
            var timer = setInterval(function () {
                //if animation is done
                if (element.style.opacity < 0) {
                    clearInterval(timer);
                } else {
                    element.style.opacity = newOpacity;
                    let ticks = (time * 1000) / 10;
                    newOpacity -= 1 / ticks;
                }
            }, 10)
            await sleep(time * 1000);
            break;
    }
}

//===============================================================Global Variables
var game = new Game();
var cooldownHandler = new CooldownHandler();
var entityDatabase = new EntityDatabase();