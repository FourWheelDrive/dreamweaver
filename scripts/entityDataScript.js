//=====================================================ENTITYDATABASE class
/*
Contents [class ENTITYDATABASE]:

*/
class EntityDatabase {
    constructor() {
        this.minorEnemies = []; //NOTE: will also require enemies to have either an ID or a tier of some sort. Some way to say "i want random of this type."
        //unless i just make different arrays for different types of enemies? hmmmm.
    }
    //Can also use another one! generateAttackByTier?
    generateAttackByName(id) {
        switch (id) {
            //NOTE: change to make more thematically appropriate later :)
            case "Light Attack":
                return new Attack(id, 11, 2, 0, "Strike nimbly.");
            case "Heavy Attack":
                return new Attack(id, 2, 4, 2, "Strike solidly.");
            case "Basic Parry":
                return new Attack(id, 0, 2, 0, "Guard against peril.", "parry", 1);
            //For testing only.
            case "Test Heal":
                return new Attack(id, -1, 3, 1, "Mend wounds.", "heal", 0);
        }
    }
    generateEnemyAttackByName(id) {

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
    //NOTE: bosses will have their own Entity subclass.
    generateBossEnemy() {

    }
}