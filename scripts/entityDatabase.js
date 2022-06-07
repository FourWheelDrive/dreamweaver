//This file is just a list of a bunch of enemies that returns an object.
function createNewEnemy(enemyTier, enemyName) {
    //enemies go from id = 0 to id = max-1
    //Duplicate one for id = max-1, in case it actually rands that one.
    let id, tier;
    let tempEnemy;

    if (enemyName !== undefined) {
        //this switch returns a specific enemy by name. For special enemies, usually.
        switch (enemyName) {
            case "The Keeper":
                tempEnemy = new Enemy(50, 30, 2, "X-1", "The Keeper", "A loyal guardian blocks the way.", "The Keeper nods. Steps aside.")
                break;
            case "The Clairvoyant":
                tempEnemy = new Enemy(100, 20, 5, 5, "The Storied Clairvoyant", "The Storied Clairvoyant scowls.", "Not so wide-eyed after all.");
                break;
        }
    } else {
        //This else returns a random enemy.
        tier = playerRandInt(1, enemyTier, "floor"); //choose a tier.
        switch (tier) { //return certain tiers of enemies.
            case 1: //Tier 1 enemies
                do {
                    id = playerRandInt(0, 5, "floor");
                    switch (id) {
                        case 0:
                            tempEnemy = new Enemy(20, 10, 3, 1, "Avarice", "A wispy shape arises from the city's crevices, all hunger and no fulfillment.", "Avarice diffuses back into the shadows.");
                            break;
                        case 1:
                            //Arrogance is naught but sharp tongue and pointing finger.
                            tempEnemy = new Enemy(30, 5, 3, 1, "Arrogance", "A creature blocks the road, all sharp tongue and pointing finger.", "Vanquishes arrogance with a cry.");
                            break;
                        case 2:
                            //Despair gives courage to the coward.
                            tempEnemy = new Enemy(5, 5, 4, 1, "Cowardice", "Despair gives courage to a shaking form.", "Cut down as it flees.");
                            break;
                        case 3:
                            //To tell a white lie.
                            tempEnemy = new Enemy(10, 15, 4, 1, "Insincerity", "Bone-white flashes in monochrome light.", "A lie in masquerade. The mask shatters.");
                            break;
                        case 4:
                            tempEnemy = new Enemy(20, 10, 3, 1, "Grief", "A keening wail pierces the silence.", "Grief abates. The ache, too, in time.");
                            break;
                        case 5:
                            //Do not cut off your nose to spite your face.
                            tempEnemy = new Enemy(30, 10, 3, 1, "Spite", "This face has no nose.", "A lilting melody quells the spite.");
                            break;
                    }
                } while (tempEnemy.name == enemy.name); //don't choose same enemy twice.
                break;
            case 2: //Tier 2 enemies
                do {
                    id = playerRandInt(0, 5, "floor");
                    switch (id) {
                        case 0:
                            tempEnemy = new Enemy(20, 10, 3, 1, "Promiscuity", "", "");
                            break;
                        case 1:
                            tempEnemy = new Enemy(30, 5, 3, 1, "Gluttony", "", "");
                            break;
                        case 2:
                            tempEnemy = new Enemy(5, 5, 4, 1, "Wrath", "", "");
                            break;
                        case 3:
                            tempEnemy = new Enemy(10, 15, 4, 1, "Cruelty", "", "");
                            break;
                        case 4:
                            tempEnemy = new Enemy(20, 10, 3, 1, "Rage", "", "");
                            break;
                        case 5:
                            tempEnemy = new Enemy(30, 10, 3, 1, "Hypocrisy", "", "");
                            break;
                    }
                } while (tempEnemy.name == enemy.name); //don't choose same enemy twice.
                break;
            case "X-1": //boss room 1 enemies
                do {
                    id = playerRandInt(0, 2, "floor");
                    switch (id) {
                        case 0:
                            break;
                        case 1:
                            break;
                        case 2:
                            break;
                    }
                } while (tempEnemy.name == enemy.name); //don't choose same enemy twice.
                break;
        }
    }

    return tempEnemy;
}

//This file is just a list of items by ID.
/* ID SCHEME
C - consumables.
T - tokens/talismans <-- for the plot.
*/
function createNewItem(id) {
    switch (id) {
        case "DRAGON-T":
            return new item("Dragon Talisman", "A blessing from the Clairvoyant. \n Give this to the Keeper!", id);
        case "HEALTH-C":
            return new item("Test Health Potion", "Ruby red, mends the soul.", id);
        case "TEST-C":
            return new item("Test consumable", "testy boi", id);
    }
}
function returnRandomItem() { //only consumables in the shop? We'll see.
    var itemIDs = ["HEALTH-C", "TEST-C"];
    var id = randInt(1, "round");

    return createNewItem(itemIDs[id]);
}


//These are possible victory scripts.
function createVictoryDialogue() {

}