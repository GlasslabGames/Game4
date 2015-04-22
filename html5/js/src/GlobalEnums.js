/**
 * Created by Rose Abernathy on 4/21/2015.
 */

var GlassLab = GlassLab || {};

// Global enum of the possible results from feeding or shipping
GlassLab.results = {
    satisfied: "satisfied", // well fed
    sick: "sick", // too much of some food
    hungry: "hungry", // not enough of some food
    dislike: "dislike", // food they didn't like
    wrongCreatureType: "wrongCreatureType", // the creature type in this pen/shipment didn't match the quest
    wrongCreatureNumber: "wrongCreatureNumber", // the number of creatures in this pen/shipment didn't match the quest
    invalid: "invalid" // this isn't a valid result (maybe the shipment or pen is incomplete
};