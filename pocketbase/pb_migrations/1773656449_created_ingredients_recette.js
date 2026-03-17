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
        "collectionId": "pbc_2869346101",
        "hidden": false,
        "id": "relation2301702121",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "recette_id",
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
        "required": true,
        "system": false,
        "type": "relation"
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
          "cuillere_a_soupe",
          "cuillere_a_cafe",
          "gousse",
          "au_gout"
        ]
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
    "id": "pbc_1803912542",
    "indexes": [],
    "listRule": null,
    "name": "ingredients_recette",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1803912542");

  return app.delete(collection);
})
