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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1819170229",
        "max": 0,
        "min": 0,
        "name": "nom",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "convertURLs": false,
        "hidden": false,
        "id": "editor1843675174",
        "maxSize": 0,
        "name": "description",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
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
        "id": "select4090410926",
        "maxSelect": 0,
        "name": "unite_par_defaut",
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
          "au_gout"
        ]
      },
      {
        "hidden": false,
        "id": "number3934136287",
        "max": null,
        "min": null,
        "name": "calories_100g",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2033805164",
        "max": null,
        "min": null,
        "name": "proteines_100g",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3464470298",
        "max": null,
        "min": null,
        "name": "glucides_100g",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2703994646",
        "max": null,
        "min": null,
        "name": "lipides_100g",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3974300041",
        "max": null,
        "min": null,
        "name": "fibres_100g",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "file3309110367",
        "maxSelect": 0,
        "maxSize": 0,
        "mimeTypes": null,
        "name": "image",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": null,
        "type": "file"
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
    "id": "pbc_4153184709",
    "indexes": [],
    "listRule": null,
    "name": "aliments",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4153184709");

  return app.delete(collection);
})
