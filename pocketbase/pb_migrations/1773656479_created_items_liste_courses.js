/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2183062763",
        "hidden": false,
        "id": "relation3897835992",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "liste_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_4153184709",
        "hidden": false,
        "id": "relation1096523537",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "aliment_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text297682117",
        "max": 0,
        "min": 0,
        "name": "nom_affiche",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1232983604",
        "maxSelect": 0,
        "name": "categorie",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "poisson",
          "viande",
          "legume",
          "fruit",
          "cereale",
          "epicerie",
          "produit_laitier",
          "autre"
        ]
      },
      {
        "hidden": false,
        "id": "number2347911801",
        "max": null,
        "min": null,
        "name": "quantite",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select493142296",
        "maxSelect": 0,
        "name": "unite",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "g",
          "kg",
          "ml",
          "l",
          "pcs",
          "bouteille",
          "tete",
          "gousse",
          "autre"
        ]
      },
      {
        "hidden": false,
        "id": "bool3141483595",
        "name": "is_checked",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number1937347273",
        "max": null,
        "min": null,
        "name": "ordre",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_732402743",
    "indexes": [],
    "listRule": null,
    "name": "items_liste_courses",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_732402743");

  return app.delete(collection);
})
