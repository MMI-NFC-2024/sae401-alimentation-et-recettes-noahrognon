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
        "collectionId": "pbc_614146362",
        "hidden": false,
        "id": "relation1032213265",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "planning_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
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
        "hidden": false,
        "id": "select3658996165",
        "maxSelect": 0,
        "name": "jour",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "lundi",
          "mardi",
          "mercredi",
          "jeudi",
          "vendredi",
          "samedi",
          "dimanche"
        ]
      },
      {
        "hidden": false,
        "id": "select2799687236",
        "maxSelect": 0,
        "name": "type_repas",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "petit_dejeuner",
          "dejeuner",
          "diner"
        ]
      },
      {
        "hidden": false,
        "id": "number3387148811",
        "max": null,
        "min": null,
        "name": "portions",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
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
    "id": "pbc_1305509034",
    "indexes": [],
    "listRule": null,
    "name": "repas_planifies",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1305509034");

  return app.delete(collection);
})
