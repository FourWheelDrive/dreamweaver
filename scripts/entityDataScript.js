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
    generateAttackByName(id){
        switch(id){
            //NOTE: change to make more thematically appropriate later :)
            case "Light Attack":
                return new Attack(id, 1, 2, 0, "Strike nimbly.");
            case "Heavy Attack":
                return new Attack(id, 2, 4, 2, "Strike solidly.");
            case "Basic Parry":
                return new Attack(id, 0, 2, 0, "Guard against peril.", "parry", 1);
            //For testing only.
            case "Test Heal":
                return new Attack(id, -1, 3, 1, "Mend wounds.", "heal", 0);
        }
    }

    //we can use 2 functions. generateEnemyByID or ByTier.
    generateEnemy(tier = 1, type = 1) {
        var tempEnemyEntity;
        tempEnemyEntity = new Enemy(11, "!", new Attack("basic attack", 1, 2, 1), ["He's just standing there, menacingly.",
            "You walk up to him.", "Menacingly."], ["Heheheha! You've won."]);

        return tempEnemyEntity;
    }
    //NOTE: bosses will have their own Entity subclass.
    generateBossEnemy() {

    }
}