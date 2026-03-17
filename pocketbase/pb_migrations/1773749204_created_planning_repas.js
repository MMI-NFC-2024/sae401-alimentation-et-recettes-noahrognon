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
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2809058197",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date304331071",
        "max": "",
        "min": "",
        "name": "date_repas",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
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
          "diner"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2869346101",
        "hidden": false,
        "id": "relation2301702121",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "recette_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number3387148811",
        "max": 20,
        "min": 0.5,
        "name": "portions",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      }
    ],
    "id": "pbc_513056443",
    "indexes": [],
    "listRule": null,
    "name": "planning_repas",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_513056443");

  return app.delete(collection);
})
