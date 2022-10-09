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
                return new Attack(id, 1, 2, 0, "Strike nimbly.");
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
                return new Attack(id, 0, 6, 1, "The mind is a fortress.", new StatusEffect(player, "barrier", duration, true, null, 
                `Negate incoming damage for ${duration} attacks.`));
            //Pierce: Ignore Barrier.
        }
    }
    generateEnemyAttackByName(id) {
    }

    //=============ENEMIES=============
    //Will bosses have their own subclass??
    generateBossByName(id){
        switch(id){
            case 1:
                return new Enemy(30, "%", new Attack("Boss1_Attack", 3, 5, 2), ["A great beast intercepts the road.", "The Clairvoyant frowns."], [""]);
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
                return new Enemy(10, "!", new Attack("Basic Attack", 1, 2, 1, "basic enemy attack"), 
                ["A wispy shape arises from the depths."], ["Diffuses back into shadow."])
            case 2: //long enemy
                return new Enemy(5, "?", new Attack("Long Attack", 3, 5, 3, "long enemy attack"), 
                [""], [""])
            case 3:
                break;
            case 4:
                break;
            case 5: //quick enemy
                return new Enemy(3, "‼", new Attack("Quick Attack", 1, 1, 0.5, "quick enemy attack"), 
                ["Bone-white flashes in monochrome light."], ["The creature shatters."])
        }
    }
}