//=====================================================ENTITYDATABASE class
/*
Contents [class ENTITYDATABASE]:

*/
class EntityDatabase {
    constructor() {
        this.minorEnemies = []; //NOTE: will also require enemies to have either an ID or a tier of some sort. Some way to say "i want random of this type."
        //unless i just make different arrays for different types of enemies? hmmmm.
    }
    //=============ATTACKS=============
    //Can also use another one! generateAttackByTier?
    generateAttackByName(id) {
        let magnitude, duration;
        switch (id) {
            //NOTE: change to make more thematically appropriate later :)
            //Attack constructor(name, damage, cooldown, channelling, description, effectObject = null)
            //Effect constructor(parent, effect, duration = null, attackIterative = false, magnitude = null, effectDescription = null)
            case "Attack":
                return new Attack(id, 11, 2, 0, "Strike nimbly.");
            case "Bash":
                return new Attack(id, 2, 4, 2, "Strike solidly.");
            case "Parry":
                duration = 1;
                return new Attack(id, 0, 2, 0, "Guard against peril.", new StatusEffect(player, "parry", duration));
            case "Heal":
                return new Attack(id, -1, 3, 1, "Mend wounds.", new StatusEffect(player, "heal"));
            //Stuns for given turns.
            case "Stun":
                duration = 3;
                return new Attack(id, 0, 4, 1, "Stun the foe.", new StatusEffect(player, "stun", duration, true, null,
                    "Prevents enemy attacks."));
            //Bleed: take 1 damage each turn.
            case "Slash":
                magnitude = 2;
                duration = 3;
                return new Attack(id, 1, 3, 1, "Rend asunder.", new StatusEffect(player, "bleed", duration, true, magnitude,
                    `Foe takes ${magnitude} damage each attack.`));
            //Barrier: Parry, but for given turns.
            case "Barrier":
                duration = 2;
                return new Attack(id, 0, 6, 2, "The mind is a fortress.", new StatusEffect(player, "barrier", duration, true, null,
                    `Negate incoming damage for ${duration} attacks.`));
            //Pierce: Ignore Barrier.
        }
    }
    generateEnemyAttackByName(id) {
    }

    //=============ENEMIES=============
    //Will bosses have their own subclass??
    generateBossByName(id) {
        let bossAttack;
        let bossEffect;
        switch (id) {
            case 1:
                bossEffect = new StatusEffect(enemy, "stun", 1, true);
                bossAttack = new Attack("boss1Attack", 3, 8, 1, "A long cooldown, heavy hitting, stun attack for boss.", bossEffect);
                return new Enemy(30, "%", bossAttack, "An Armoured Behemoth",
                    ["A great beast bars the road.", "Its bulk shrouds the boulevard in darkness."],
                    ["A final roar shakes the city.", "It seems a little brighter."]);
            case 2:
                bossEffect = new StatusEffect();
        }
    }
    //we can use 2 functions. generateEnemyByID or ByTier.
    //ℵ ℑ ℜ ¡ ? ¿ 
    generateTier1Enemy(type = -1) {
        //can either use random or given type!
        let temp;
        if (type != -1) {
            temp = type;
        } else {
            temp = randInt(3);
        }
        switch (temp) {
            case 1: //normal enemy
                return new Enemy(10, "!", new Attack("Basic Attack", 5, 2, 1, "basic enemy attack"), "a boi",
                    ["A wispy shape arises from the depths."], ["Diffuses back into shadow."])
            case 2: //long enemy
                return new Enemy(5, "?", new Attack("Long Attack", 3, 5, 3, "long enemy attack"), "another boi",
                    [""], [""])
            case 3:
                break;
            case 4:
                break;
            case 5: //quick enemy
                return new Enemy(3, "‼", new Attack("Quick Attack", 1, 1, 0.5, "quick enemy attack"), "a quick boi",
                    ["Bone-white flashes in monochrome light."], ["The creature shatters."])
        }
    }
}
class DialogueNode {
    constructor(tag, entryText, options) {
        this.tag = tag;
        this.entryText = entryText;
        this.options = options;
    }
    /*
    options include the next node number.
     */
    async nodeEntered() {
        //Output all the text for this node.
        await sleep(100);
        for (var i = 0; i < this.entryText.length; i++) {
            pushMainOutput(this.entryText[i]);
            await sleep(1500);
        }
        //Draw all the options, including LEAVE.
        //NOTE: when an option is chosen here, delete this div or disable it.
        var outputDiv = document.getElementById("gamePage__outputBar");
        var newMenuDiv = document.createElement("div");
        newMenuDiv.setAttribute("id", "outputOptionMenu");
        newMenuDiv.setAttribute("class", "outputOptionMenu");

        for (var j = 0; j < this.options.length + 1; j++) {
            var tempButton = document.createElement("button");
            tempButton.setAttribute("class", "outputMenuButton")

            if (j == this.options.length) {        //Draw the LEAVE button last.
                tempButton.setAttribute("id", `leave`); //leave
                var tempText = document.createTextNode(`leave`);
            } else {                            //Draw all the other buttons.
                tempButton.setAttribute("id", `${this.options[j][1]}`); //button id is next node tag.
                var tempText = document.createTextNode(`${this.options[j][0]}`);
            }
            tempButton.appendChild(tempText);
            newMenuDiv.appendChild(tempButton);
        }
        //Add an event listener to the body. Will go to the next node right here, and delete itself.
        document.addEventListener("click", function outputMenuListener(event) {
            if (event.target.classList.contains("outputMenuButton")) {
                //delete itself and the buttons if clicked.
                document.removeEventListener("click", outputMenuListener);
                document.getElementById("outputOptionMenu").remove();
                //LEAVE case.
                if (event.target.id == "leave") {
                    player.getCurrentCellEntity().endVisit();
                } else { //All the other cases: Begin the next dialogue.
                    console.log(event.target.id);
                    dialogueDictionary[event.target.id].nodeEntered();
                }
            }
        })

        //insert new div. Delete when input received.
        outputDiv.insertBefore(newMenuDiv, outputDiv.firstChild);
    }
}
class EncounterNode{ //Some DialogueNodes will be of this class instead. It begins an encounter instead of just moving to options.
    constructor(tag, enemyType, options) {
        this.tag = tag;
        this.options = options;
    }
    async nodeEntered(){ //Basically just setup. Hands off the encounter to Game class.
        //call getNewEnemy when it's done.
        var canvas = document.getElementById("gamePage__gameSpace__encounter__canvas__gameCanvas");
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
        document.getElementById("gamePage__gameSpace__inventory__canvas").style.display = "none";

        const ctx = canvas.getContext("2d");
        player.canvasX = canvas.offsetWidth/4;
        //enemy.canvasX = canvas.offsetWidth*(3/4);

        initializeCanvas();
        ctx.font = "2em monospace"
        ctx.fillText("@", player.canvasX, canvas.offsetHeight/2);
        ctx.fillText("!!", canvas.offsetWidth*(3/4), canvas.offsetHeight/2);
    }
    encounterNodeExit(){
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
        document.getElementById("gamePage__gameSpace__inventory__canvas").style.display = "grid";
    }
    getNewEnemy(){

    }
}

//=====================================================DIALOGUE backend classes and DICTIONARY
//Access with dialogueDictionary["1.1"].nodeEntered().
const dialogueDictionary = {
    /*"1.1": new DialogueNode("1.1", ["Text1", "text2"], [
        ["option1", "1.2"],
        ["option2", "1.3"]]
    ),*/
    "1.1": new EncounterNode("1.1", -1, [
        ["option1", "1.2"],
        ["option2", "1.3"]
    ]),
    "1.2": new DialogueNode("1.2", ["Text1.1", "text1.2"], [

    ]),
}