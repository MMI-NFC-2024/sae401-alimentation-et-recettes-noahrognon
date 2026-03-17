/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
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
        "collectionId": "pbc_2700233954",
        "hidden": false,
        "id": "relation2146064832",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "suivi_id",
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
        "maxSelect": 1,
        "minSelect": 1,
        "name": "aliment_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select2799687236",
        "maxSelect": 1,
        "name": "type_repas",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "petit_dejeuner",
          "dejeuner",
          "diner",
          "collation"
        ]
      },
      {
        "hidden": false,
        "id": "number3352839772",
        "max": null,
        "min": null,
        "name": "quantite_g",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2721331659",
        "max": null,
        "min": null,
        "name": "calories_total",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number134109386",
        "max": null,
        "min": null,
        "name": "proteines_total_g",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number341361551",
        "max": null,
        "min": null,
        "name": "glucides_total_g",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2919405978",
        "max": null,
        "min": null,
        "name": "lipides_total_g",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "id": "pbc_874372381",
    "indexes": [],
    "listRule": "",
    "name": "aliments_consommes",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_874372381");

  return app.delete(collection);
})
